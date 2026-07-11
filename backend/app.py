import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from config import Config
from models import db, User, HomepageSettings
from routes.auth_routes import auth_bp
from routes.courses_routes import courses_bp
from routes.tutor_routes import tutor_bp
from routes.admin_routes import admin_bp
from routes.settings_routes import settings_bp
from routes.payment_routes import payment_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    cors_origins = os.getenv(
        'CORS_ORIGINS',
        'http://localhost:8701,http://127.0.0.1:8701'
    ).split(',')
    CORS(app, origins=[o.strip() for o in cors_origins if o.strip()], supports_credentials=True)

    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    db.init_app(app)

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(courses_bp, url_prefix='/api/courses')
    app.register_blueprint(tutor_bp, url_prefix='/api/tutor')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(settings_bp, url_prefix='/api/settings')
    app.register_blueprint(payment_bp, url_prefix='/api/payment')

    @app.route('/api/uploads/<filename>')
    def uploaded_file(filename):
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

    @app.route('/api/health')
    def health():
        return {'status': 'ok', 'service': 'KayaKarya Course API'}

    with app.app_context():
        db.create_all()
        admin = User.query.filter_by(email='admin@kayakarya.com').first()
        if not admin:
            admin = User(
                email='admin@kayakarya.com',
                name='Admin KayaKarya',
                google_id='admin-local',
                role='admin'
            )
            db.session.add(admin)
            db.session.commit()

        if not HomepageSettings.query.first():
            db.session.add(HomepageSettings(
                tagline='Belajar Kreatif, Raih Karya',
                title='Temukan Course Kreatif Terbaik',
                subtitle='Belajar langsung dari para ahli. Dari desain, ilustrasi, hingga fotografi.',
                cta_text='Mulai dengan Google Account',
            ))
            db.session.commit()

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=8702, debug=True)
