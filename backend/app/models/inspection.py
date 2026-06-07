from datetime import datetime
from app import db

class Inspection(db.Model):
    __tablename__ = 'inspections'

    id            = db.Column(db.Integer, primary_key=True)
    timestamp     = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    class_name    = db.Column(db.String(50), nullable=False)
    confidence    = db.Column(db.Float, nullable=False)
    is_defective  = db.Column(db.Boolean, default=False, nullable=False)
    image_path    = db.Column(db.String(255), nullable=True)

    def to_dict(self):
        return {
            'id':           self.id,
            'timestamp':    self.timestamp.isoformat(),
            'class_name':   self.class_name,
            'confidence':   round(self.confidence, 4),
            'is_defective': self.is_defective,
            'image_path':   self.image_path,
        }