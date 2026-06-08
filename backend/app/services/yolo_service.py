import cv2
import base64
from ultralytics import YOLO
from config import Config

class YOLOService:
    def __init__(self):
        self.model          = YOLO(Config.MODEL_PATH)
        self.confidence     = Config.CONFIDENCE_THRESHOLD
        self.class_names    = Config.CLASS_NAMES
        
        # Detection locking — hold result for N frames
        self.locked_detections = []
        self.lock_counter      = 0
        self.lock_frames       = 25  # hold detection for 15 frames (~1.5 sec at 10fps)
        
        print(f"[YOLO] Model loaded from {Config.MODEL_PATH}")

    def predict(self, frame):
        results     = self.model(frame, conf=self.confidence, verbose=False)
        detections  = []

        for result in results:
            for box in result.boxes:
                cls_id     = int(box.cls[0])
                conf       = float(box.conf[0])
                class_name = self.class_names[cls_id]
                x1, y1, x2, y2 = map(int, box.xyxy[0])

                detections.append({
                    'class_name':  class_name,
                    'confidence':  round(conf, 4),
                    'bbox':        [x1, y1, x2, y2],
                    'is_defective': class_name != 'Correct-Bottle'
                })

        # Lock logic — only update when lock expires or new detection arrives
        if detections:
            if self.lock_counter <= 0:
                # New detection — lock it in
                self.locked_detections = detections
                self.lock_counter      = self.lock_frames
            else:
                # Still locked — keep previous detection, just decrement
                self.lock_counter -= 1
                detections = self.locked_detections
        else:
            # No detection in frame — count down lock
            if self.lock_counter > 0:
                self.lock_counter -= 1
                detections = self.locked_detections
            else:
                self.locked_detections = []

        annotated = results[0].plot()
        return annotated, detections

    def frame_to_base64(self, frame):
        _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
        return base64.b64encode(buffer).decode('utf-8')


yolo_service = YOLOService()