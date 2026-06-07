from flask import Blueprint, jsonify, request
from app.services.plc_service import plc_service

plc_bp = Blueprint('plc', __name__)

@plc_bp.route('/status', methods=['GET'])
def status():
    return jsonify(plc_service.get_status())

@plc_bp.route('/command', methods=['POST'])
def command():
    data = request.get_json()
    cmd  = data.get('command')
    result = plc_service.send_command(cmd)
    return jsonify(result)