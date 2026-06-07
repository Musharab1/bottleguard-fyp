import eventlet
eventlet.monkey_patch()

from app import create_app, socketio
from app.services.yolo_service  import yolo_service
from app.services.camera_service import camera_service
from app.models.inspection import Inspection
from app import db
from datetime import datetime
import threading

app = create_app()

def detection_loop():
    """Main loop: grab frame → YOLO → emit over WebSocket → save to DB."""
    camera_service.start()

    with app.app_context():
        while camera_service.is_running():
            ret, frame = camera_service.read_frame()
            if not ret:
                continue

            annotated, detections = yolo_service.predict(frame)
            b64_frame = yolo_service.frame_to_base64(annotated)

            # Emit frame to all connected React clients
            socketio.emit('frame', {
                'image':      b64_frame,
                'detections': detections,
                'timestamp':  datetime.utcnow().isoformat()
            })

            # Save each detection to DB
            for det in detections:
                record = Inspection(
                    class_name   = det['class_name'],
                    confidence   = det['confidence'],
                    is_defective = det['is_defective'],
                )
                db.session.add(record)
            if detections:
                db.session.commit()

            eventlet.sleep(0)  # yield to other greenlets

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
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)