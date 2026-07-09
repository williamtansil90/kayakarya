from flask import Blueprint, request, jsonify, g
from models import (
    db, Course, Material, Enrollment, MaterialProgress,
    CommunityTopic, Sale, WithdrawRequest
)
from course_utils import replace_course_materials, add_materials_to_course
from auth import login_required, role_required

tutor_bp = Blueprint('tutor', __name__)


@tutor_bp.route('/courses', methods=['GET'])
@role_required('tutor', 'admin')
def list_my_courses():
    courses = Course.query.filter_by(tutor_id=g.current_user.id).order_by(Course.created_at.desc()).all()
    result = []
    for c in courses:
        data = c.to_dict()
        paid_sales = Sale.query.filter_by(course_id=c.id, status='paid').count()
        data['total_buyers'] = paid_sales
        result.append(data)
    return jsonify({'courses': result})


@tutor_bp.route('/courses', methods=['POST'])
@role_required('tutor', 'admin')
def create_course():
    data = request.get_json()
    course = Course(
        tutor_id=g.current_user.id,
        title=data['title'],
        intro_video_url=data.get('intro_video_url', ''),
        information=data.get('information', ''),
        price=data.get('price', 0),
        thumbnail_url=data.get('thumbnail_url', '')
    )
    db.session.add(course)
    db.session.flush()

    add_materials_to_course(course.id, data.get('materials', []))

    db.session.commit()
    return jsonify({'course': course.to_dict(include_materials=True)}), 201


@tutor_bp.route('/courses/<int:course_id>', methods=['GET'])
@role_required('tutor', 'admin')
def get_course_detail(course_id):
    course = Course.query.get_or_404(course_id)
    if course.tutor_id != g.current_user.id and g.current_user.role != 'admin':
        return jsonify({'error': 'Not your course'}), 403

    enrollments = Enrollment.query.filter_by(course_id=course_id, payment_status='paid').all()
    completed_users = []
    incomplete_users = []

    for e in enrollments:
        prog = e.to_dict(include_progress=True)
        user_data = {
            'user_id': e.user_id,
            'user_name': e.user.name if e.user else None,
            'user_avatar': e.user.avatar_url if e.user else None,
            'progress_percent': prog['progress_percent'],
            'is_completed': prog['is_completed'],
        }
        if prog['is_completed']:
            completed_users.append(user_data)
        else:
            incomplete_users.append(user_data)

    data = course.to_dict(include_materials=True)
    data['total_buyers'] = len(enrollments)
    data['total_completed'] = len(completed_users)
    data['total_incomplete'] = len(incomplete_users)
    data['completed_users'] = completed_users
    data['incomplete_users'] = incomplete_users
    return jsonify({'course': data})


@tutor_bp.route('/courses/<int:course_id>', methods=['PUT'])
@role_required('tutor', 'admin')
def update_course(course_id):
    course = Course.query.get_or_404(course_id)
    if course.tutor_id != g.current_user.id and g.current_user.role != 'admin':
        return jsonify({'error': 'Not your course'}), 403

    data = request.get_json()
    course.title = data.get('title', course.title)
    course.intro_video_url = data.get('intro_video_url', course.intro_video_url)
    course.information = data.get('information', course.information)
    course.price = data.get('price', course.price)
    course.thumbnail_url = data.get('thumbnail_url', course.thumbnail_url)

    if 'materials' in data:
        replace_course_materials(course_id, data['materials'])

    db.session.commit()
    return jsonify({'course': course.to_dict(include_materials=True)})


@tutor_bp.route('/courses/<int:course_id>/community', methods=['POST'])
@role_required('tutor', 'admin')
def tutor_create_topic(course_id):
    course = Course.query.get_or_404(course_id)
    if course.tutor_id != g.current_user.id:
        return jsonify({'error': 'Not your course'}), 403

    data = request.get_json()
    topic = CommunityTopic(
        course_id=course_id,
        user_id=g.current_user.id,
        title=data['title'],
        content=data.get('content', ''),
        is_main_topic=data.get('is_main_topic', True),
        parent_id=data.get('parent_id')
    )
    db.session.add(topic)
    db.session.commit()
    return jsonify({'topic': topic.to_dict()}), 201


@tutor_bp.route('/sales', methods=['GET'])
@role_required('tutor', 'admin')
def tutor_sales():
    sales = Sale.query.filter_by(tutor_id=g.current_user.id).order_by(Sale.created_at.desc()).all()
    total_revenue = sum(float(s.amount) for s in sales if s.status == 'paid')
    total_withdrawn = sum(
        float(w.amount) for w in WithdrawRequest.query.filter_by(
            tutor_id=g.current_user.id, status='paid'
        ).all()
    )
    pending_withdraw = sum(
        float(w.amount) for w in WithdrawRequest.query.filter_by(
            tutor_id=g.current_user.id, status='pending'
        ).all()
    )
    available = total_revenue - total_withdrawn - pending_withdraw

    return jsonify({
        'sales': [s.to_dict() for s in sales],
        'total_revenue': total_revenue,
        'total_withdrawn': total_withdrawn,
        'pending_withdraw': pending_withdraw,
        'available_balance': max(0, available),
    })


@tutor_bp.route('/withdraw', methods=['POST'])
@role_required('tutor', 'admin')
def request_withdraw():
    data = request.get_json()
    amount = float(data.get('amount', 0))
    if amount <= 0:
        return jsonify({'error': 'Invalid amount'}), 400

    sales = Sale.query.filter_by(tutor_id=g.current_user.id, status='paid').all()
    total_revenue = sum(float(s.amount) for s in sales)
    total_withdrawn = sum(
        float(w.amount) for w in WithdrawRequest.query.filter_by(
            tutor_id=g.current_user.id, status='paid'
        ).all()
    )
    pending = sum(
        float(w.amount) for w in WithdrawRequest.query.filter_by(
            tutor_id=g.current_user.id, status='pending'
        ).all()
    )
    available = total_revenue - total_withdrawn - pending

    if amount > available:
        return jsonify({'error': f'Insufficient balance. Available: {available}'}), 400

    withdraw = WithdrawRequest(tutor_id=g.current_user.id, amount=amount)
    db.session.add(withdraw)
    db.session.commit()
    return jsonify({'withdraw': withdraw.to_dict()}), 201


@tutor_bp.route('/withdraw', methods=['GET'])
@role_required('tutor', 'admin')
def list_withdraws():
    withdraws = WithdrawRequest.query.filter_by(
        tutor_id=g.current_user.id
    ).order_by(WithdrawRequest.created_at.desc()).all()
    return jsonify({'withdraws': [w.to_dict() for w in withdraws]})
