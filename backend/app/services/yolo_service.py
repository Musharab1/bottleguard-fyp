import cv2
import base64
from ultralytics import YOLO
from config import Config

class YOLOService:
    def __init__(self):
        self.model          = YOLO(Config.MODEL_PATH)
        self.confidence     = Config.CONFIDENCE_THRESHOLD
        self.class_names    = Config.CLASS_NAMES

        self.locked_detections = []
        self.lock_counter      = 0
        self.lock_frames       = 0

        # ✅ Print model's own class names so we can verify they match config
        print(f"[YOLO] Model loaded from {Config.MODEL_PATH}")
        print(f"[YOLO] Model classes: {self.model.names}")
        print(f"[YOLO] Config classes: {self.class_names}")

    def predict(self, frame):
        results    = self.model(frame, conf=self.confidence, verbose=False)
        detections = []

        for result in results:
            for box in result.boxes:
                cls_id = int(box.cls[0])
                conf   = float(box.conf[0])

                # ✅ Use model's own class names — never use config index
                # This prevents IndexError if cls_id doesn't match config list
                class_name = self.model.names.get(cls_id)

                if class_name is None:
                    print(f"[YOLO] Unknown cls_id={cls_id} — skipping")
                    continue

                x1, y1, x2, y2 = map(int, box.xyxy[0])

                detections.append({
                    'class_name':   class_name,
                    'confidence':   round(conf, 4),
                    'bbox':         [x1, y1, x2, y2],
                    'is_defective': class_name != 'Correct-Bottle'
                })

        # Lock logic
        if detections:
            if self.lock_counter <= 0:
                self.locked_detections = detections
                self.lock_counter      = self.lock_frames
            else:
                self.lock_counter -= 1
                detections = self.locked_detections
        else:
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