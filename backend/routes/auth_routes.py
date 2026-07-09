import os
import uuid
from flask import Blueprint, request, jsonify, g, current_app
from werkzeug.utils import secure_filename
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from models import db, User
from auth import login_required

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/google', methods=['POST'])
def google_auth():
    data = request.get_json()
    token = data.get('credential') or data.get('token')
    role = data.get('role', 'student')

    if not token:
        return jsonify({'error': 'Token required'}), 400

    try:
        idinfo = id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            current_app.config['GOOGLE_CLIENT_ID']
        )
        google_id = idinfo['sub']
        email = idinfo['email']
        name = idinfo.get('name', email.split('@')[0])
        avatar_url = idinfo.get('picture', '')

        user = User.query.filter_by(google_id=google_id).first()
        if not user:
            user = User.query.filter_by(email=email).first()
            if user:
                user.google_id = google_id
                user.avatar_url = avatar_url
            else:
                user = User(
                    email=email,
                    name=name,
                    avatar_url=avatar_url,
                    google_id=google_id,
                    role=role if role in ('student', 'tutor', 'admin') else 'student'
                )
                db.session.add(user)
        else:
            user.name = name
            user.avatar_url = avatar_url

        db.session.commit()
        return jsonify({'user': user.to_dict()})

    except ValueError as e:
        return jsonify({'error': f'Invalid token: {str(e)}'}), 401


@auth_bp.route('/me', methods=['GET'])
@login_required
def get_me():
    return jsonify({'user': g.current_user.to_dict()})


@auth_bp.route('/register-tutor', methods=['POST'])
@login_required
def register_tutor():
    user = g.current_user
    if user.role == 'tutor':
        return jsonify({'message': 'Already a tutor', 'user': user.to_dict()})

    data = request.get_json() or {}
    user.role = 'tutor'
    user.bio = data.get('bio', user.bio)
    user.bank_name = data.get('bank_name', user.bank_name)
    user.bank_account = data.get('bank_account', user.bank_account)
    user.bank_holder = data.get('bank_holder', user.bank_holder)
    db.session.commit()
    return jsonify({'user': user.to_dict()})


ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@auth_bp.route('/upload', methods=['POST'])
@login_required
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if file and allowed_file(file.filename):
        ext = file.filename.rsplit('.', 1)[1].lower()
        filename = f"{uuid.uuid4().hex}.{ext}"
        upload_dir = current_app.config['UPLOAD_FOLDER']
        os.makedirs(upload_dir, exist_ok=True)
        filepath = os.path.join(upload_dir, filename)
        file.save(filepath)
        url = f"/api/uploads/{filename}"
        return jsonify({'url': url})

    return jsonify({'error': 'Invalid file type'}), 400
