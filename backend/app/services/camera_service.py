import cv2
import threading
from config import Config

class CameraService:
    def __init__(self):
        self.cap          = None
        self.running      = False
        self.lock         = threading.Lock()
        self.use_video    = False  # ✅ flag: video or live camera

    def start(self, video_path=None):
        if video_path:
            # ✅ Test video mode
            self.cap       = cv2.VideoCapture(video_path)
            self.use_video = True
            print(f"[Camera] Using test video: {video_path}")
        else:
            # ✅ Live camera mode
            self.cap       = cv2.VideoCapture(Config.CAMERA_INDEX)
            self.use_video = False
            print(f"[Camera] Using live camera: index {Config.CAMERA_INDEX}")

        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH,  Config.FRAME_WIDTH)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, Config.FRAME_HEIGHT)

        if not self.use_video:
            # ✅ Live camera optimizations
            self.cap.set(cv2.CAP_PROP_FPS,        30)
            self.cap.set(cv2.CAP_PROP_BUFFERSIZE,  1)  # minimize lag

        self.running = self.cap.isOpened()
        print(f"[Camera] Started: {self.running}")
        return self.running

    def read_frame(self):
        if not self.cap or not self.running:
            return False, None

        with self.lock:
            if not self.use_video:
                # ✅ Live camera — grab discards buffered frames
                # keeps feed real-time instead of falling behind
                self.cap.grab()
                self.cap.grab()  # discard 2 buffered frames
                ret, frame = self.cap.retrieve()
            else:
                # ✅ Video file — normal read
                ret, frame = self.cap.read()

            if not ret:
                if self.use_video:
                    # Video ended — stop cleanly
                    print("[Camera] Video ended")
                    self.stop()
                else:
                    # Live camera lost — try to reconnect
                    print("[Camera] Frame lost — reconnecting...")
                    self.cap.release()
                    self.cap = cv2.VideoCapture(Config.CAMERA_INDEX)
                    self.running = self.cap.isOpened()
                return False, None

            return ret, frame

    def stop(self):
        self.running = False
        if self.cap:
            self.cap.release()
            self.cap = None
        print("[Camera] Stopped")

    def is_running(self):
        return self.running

    def get_info(self):
        """Returns camera info for status endpoint"""
        if not self.cap:
            return {'running': False}
        return {
            'running':   self.running,
            'mode':      'video' if self.use_video else 'live',
            'width':     int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
            'height':    int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT)),
            'fps':       int(self.cap.get(cv2.CAP_PROP_FPS)),
        }


camera_service = CameraService()