from functools import wraps
from flask import request, jsonify, g
from models import User


def get_current_user():
    user_id = request.headers.get('X-User-Id')
    if not user_id:
        return None
    try:
        return User.query.get(int(user_id))
    except (TypeError, ValueError):
        return None


def auth_error_response():
    user_id = request.headers.get('X-User-Id')
    if user_id:
        return jsonify({'error': 'Session expired. Please login again.'}), 401
    return jsonify({'error': 'Authentication required'}), 401


def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if not user:
            return auth_error_response()
        g.current_user = user
        return f(*args, **kwargs)
    return decorated


def role_required(*roles):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            user = get_current_user()
            if not user:
                return auth_error_response()
            if user.role not in roles:
                return jsonify({'error': 'Insufficient permissions'}), 403
            g.current_user = user
            return f(*args, **kwargs)
        return decorated
    return decorator
