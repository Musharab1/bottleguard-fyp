import cv2
import threading
from config import Config

class CameraService:
    def __init__(self):
        self.cap = None
        self.running = False
        self.lock = threading.Lock()

    def start(self):
        self.cap = cv2.VideoCapture(Config.CAMERA_INDEX)
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH,  Config.FRAME_WIDTH)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, Config.FRAME_HEIGHT)
        self.running = self.cap.isOpened()
        print(f"[Camera] Started: {self.running}")
        return self.running

    def read_frame(self):
        if not self.cap or not self.running:
            return False, None
        with self.lock:
            ret, frame = self.cap.read()
        return ret, frame

    def stop(self):
        self.running = False
        if self.cap:
            self.cap.release()
        print("[Camera] Stopped")

    def is_running(self):
        return self.running


camera_service = CameraService()