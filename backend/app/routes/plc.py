from flask import Blueprint, jsonify, request
from app.services.plc_service import plc_service

plc_bp = Blueprint('plc', __name__)

VALID_COMMANDS = {'START', 'STOP', 'SORT', 'RESET', 'STATUS'}

@plc_bp.route('/status', methods=['GET'])
def status():
    return jsonify(plc_service.get_status())

@plc_bp.route('/command', methods=['POST'])
def command():
    data = request.get_json()

    if not data or 'command' not in data:
        return jsonify({'success': False, 'error': 'No command provided'}), 400

    cmd = data.get('command', '').upper()

    if cmd not in VALID_COMMANDS:
        return jsonify({'success': False, 'error': f'Invalid command: {cmd}'}), 400

    result = plc_service.send_command(cmd)
    return jsonify(result)