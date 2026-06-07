from flask import Blueprint, jsonify
from app.services.camera_service import camera_service

detection_bp = Blueprint('detection', __name__)

@detection_bp.route('/status', methods=['GET'])
def status():
    return jsonify({
        'camera_running': camera_service.is_running(),
        'status': 'ok'
    })