from flask import Blueprint, jsonify, request
from app.models.inspection import Inspection
from app import db

history_bp = Blueprint('history', __name__)

@history_bp.route('/', methods=['GET'])
def get_history():
    page     = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    records = Inspection.query.order_by(
        Inspection.timestamp.desc()
    ).paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'records': [r.to_dict() for r in records.items],
        'total':   records.total,
        'page':    records.page,
        'pages':   records.pages
    })

@history_bp.route('/stats', methods=['GET'])
def get_stats():
    total      = Inspection.query.count()
    defective  = Inspection.query.filter_by(is_defective=True).count()
    correct    = Inspection.query.filter_by(is_defective=False).count()
    cap        = Inspection.query.filter_by(class_name='Cap-missing').count()
    label      = Inspection.query.filter_by(class_name='Label-missing').count()

    return jsonify({
        'total':         total,
        'correct':       correct,
        'defective':     defective,
        'cap_missing':   cap,
        'label_missing': label,
        'defect_rate':   round((defective / total * 100), 2) if total > 0 else 0
    })