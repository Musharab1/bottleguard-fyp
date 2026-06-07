from flask import Blueprint, Response
from app.models.inspection import Inspection
import csv
import io

export_bp = Blueprint('export', __name__)

@export_bp.route('/csv', methods=['GET'])
def export_csv():
    records = Inspection.query.order_by(Inspection.timestamp.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['ID', 'Timestamp', 'Class', 'Confidence', 'Is Defective'])
    for r in records:
        writer.writerow([
            r.id,
            r.timestamp.isoformat(),
            r.class_name,
            round(r.confidence, 4),
            r.is_defective
        ])

    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment; filename=bottleguard_export.csv'}
    )