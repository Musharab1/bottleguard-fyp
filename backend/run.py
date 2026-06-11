import eventlet
eventlet.monkey_patch()

from app import create_app, socketio
from app.services.yolo_service   import yolo_service
from app.services.camera_service import camera_service
from app.services.plc_service    import plc_service
from app.models.inspection import Inspection
from app import db
from datetime import datetime
import threading
import time

app = create_app()

# ──────────────────────────────────────────────
# Bottle Tracker
# ──────────────────────────────────────────────
class BottleTracker:
    """
    Tracks bottles by their horizontal position.
    A 'new' bottle is one whose center_x doesn't overlap
    with any already-tracked bottle's last known x range.
    """
    def __init__(self, overlap_margin=80, max_age_frames=60):
        self.tracked   = {}          # bottle_id -> {'center_x', 'age', 'logged'}
        self.next_id   = 1
        self.margin    = overlap_margin   # px — how close = same bottle
        self.max_age   = max_age_frames   # frames before we forget a bottle

    def _find_match(self, center_x):
        """Return bottle_id if center_x is close to a tracked bottle, else None."""
        best_id   = None
        best_dist = self.margin + 1
        for bid, info in self.tracked.items():
            dist = abs(center_x - info['center_x'])
            if dist < best_dist:
                best_dist = dist
                best_id   = bid
        return best_id

    def update(self, detections, entry_x):
        """
        Call once per frame with the list of detections.
        Returns list of (bottle_id, det) for bottles being logged THIS frame.
        """
        to_log = []
        matched_ids = set()

        for det in detections:
            x1, _, x2, _ = det['bbox']
            center_x = (x1 + x2) // 2

            # Only care about bottles in the entry zone (right side)
            if center_x < entry_x:
                continue

            bid = self._find_match(center_x)

            if bid is None:
                # ✅ Brand-new bottle — assign ID, mark for logging
                bid = self.next_id
                self.next_id += 1
                self.tracked[bid] = {
                    'center_x': center_x,
                    'age':      0,
                    'logged':   False,
                }
                print(f"[Tracker] New bottle #{bid} at x={center_x}")

            # Update position and reset age
            self.tracked[bid]['center_x'] = center_x
            self.tracked[bid]['age']      = 0
            matched_ids.add(bid)

            # Log confidence only once per bottle
            if not self.tracked[bid]['logged']:
                self.tracked[bid]['logged'] = True
                to_log.append((bid, det))

        # Age out bottles not seen this frame
        stale = []
        for bid in list(self.tracked):
            if bid not in matched_ids:
                self.tracked[bid]['age'] += 1
                if self.tracked[bid]['age'] > self.max_age:
                    print(f"[Tracker] Bottle #{bid} left frame — forgotten")
                    stale.append(bid)
        for bid in stale:
            del self.tracked[bid]

        return to_log


# ──────────────────────────────────────────────
# Detection loop
# ──────────────────────────────────────────────
def detection_loop():
    camera_service.start()

    ENTRY_ZONE_PCT = 0.65   # right 35% of frame = entry zone
    tracker        = BottleTracker(overlap_margin=80, max_age_frames=60)

    with app.app_context():
        while camera_service.is_running():
            ret, frame = camera_service.read_frame()
            if not ret:
                continue

            frame_width = frame.shape[1]
            entry_x     = frame_width * ENTRY_ZONE_PCT

            annotated, detections = yolo_service.predict(frame)
            b64_frame = yolo_service.frame_to_base64(annotated)

            socketio.emit('frame', {
                'image':      b64_frame,
                'detections': detections,
                'timestamp':  datetime.utcnow().isoformat()
            })

            # ── Per-bottle logging ──────────────────────────
            to_log = tracker.update(detections, entry_x)

            for bottle_id, det in to_log:
                print(f"[BottleGuard] Logging bottle #{bottle_id}: "
                      f"{det['class_name']} conf={det['confidence']:.3f}")

                record = Inspection(
                    class_name   = det['class_name'],
                    confidence   = det['confidence'],
                    is_defective = det['is_defective'],
                )
                db.session.add(record)
                db.session.commit()

                if det['is_defective']:
                    print(f"[BottleGuard] Bottle #{bottle_id} → DEFECT → SORT")
                    def sort_and_reset():
                        plc_service.send_command('SORT')
                        time.sleep(5)
                        plc_service.send_command('RESET')
                    threading.Thread(target=sort_and_reset, daemon=True).start()
                else:
                    print(f"[BottleGuard] Bottle #{bottle_id} → OK")

            eventlet.sleep(0)


# ──────────────────────────────────────────────
# Socket events
# ──────────────────────────────────────────────
@socketio.on('connect')
def handle_connect():
    print('[WS] Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('[WS] Client disconnected')

@socketio.on('start_stream')
def handle_start():
    t = threading.Thread(target=detection_loop, daemon=True)
    t.start()

@socketio.on('stop_stream')
def handle_stop():
    camera_service.stop()

if __name__ == '__main__':
    print("[BottleGuard] Server starting on http://localhost:5000")
    # ✅ Removed duplicate plc_service.connect() — already called inside create_app()
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, use_reloader=False)