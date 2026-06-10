from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO
from flask_cors import CORS
from config import Config

db = SQLAlchemy()
socketio = SocketIO()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Extensions
    db.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    socketio.init_app(app, cors_allowed_origins=Config.CORS_ORIGINS,
                      async_mode='eventlet')

    # Register blueprints
    from app.routes.detection import detection_bp
    from app.routes.history   import history_bp
    from app.routes.plc       import plc_bp
    from app.routes.export    import export_bp

    app.register_blueprint(detection_bp, url_prefix='/api/detection')
    app.register_blueprint(history_bp,   url_prefix='/api/history')
    app.register_blueprint(plc_bp,       url_prefix='/api/plc')
    app.register_blueprint(export_bp,    url_prefix='/api/export')

    # Create DB tables
    with app.app_context():
        db.create_all()

    # Auto-connect to Arduino if available
    from app.services.plc_service import plc_service
    plc_service.connect(port='COM5')

    return app