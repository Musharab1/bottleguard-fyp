import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

class Config:
    # Flask
    SECRET_KEY = os.environ.get('SECRET_KEY', 'bottleguard-dev-secret-2025')
    DEBUG = True

    # Database
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{BASE_DIR / 'bottleguard.db'}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # YOLO
    MODEL_PATH = str(BASE_DIR / 'weights' / 'best.pt')
    CONFIDENCE_THRESHOLD = 0.7
    CLASS_NAMES = ['Cap-missing', 'Correct-Bottle', 'Label-missing']

    # Camera
    
    CAMERA_INDEX = 0

    #CAMERA_INDEX = 1    # ---> for the cable camera
    
    # CAMERA_INDEX = r'C:\Users\PMLS\Documents\FYP\FYP\bottleguard-fyp\backend\test_videos\bottles_test.mp4'

    FRAME_WIDTH = 640
    FRAME_HEIGHT = 480

    # Paths
    EXPORTS_DIR = str(BASE_DIR / 'exports')
    LOGS_DIR = str(BASE_DIR / 'logs')

    # CORS
    CORS_ORIGINS = ['http://localhost:3000']