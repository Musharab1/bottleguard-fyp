from flask import Blueprint, jsonify

export_bp = Blueprint('export', __name__)

@export_bp.route('/csv', methods=['GET'])
def export_csv():
    return jsonify({'message': 'CSV export coming in Phase 2'})