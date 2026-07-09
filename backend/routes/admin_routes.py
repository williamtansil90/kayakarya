from datetime import datetime
from flask import Blueprint, request, jsonify, g
from sqlalchemy import or_
from models import (
    db, User, Course, Material, Enrollment, Sale,
    WithdrawRequest, CommunityTopic, HomepageSettings
)
from routes.settings_routes import get_homepage_settings
from course_utils import replace_course_materials
from auth import login_required, role_required

admin_bp = Blueprint('admin', __name__)


@admin_bp.route('/dashboard', methods=['GET'])
@role_required('admin')
def dashboard():
    total_users = User.query.filter_by(role='student').count()
    total_tutors = User.query.filter_by(role='tutor').count()
    total_courses = Course.query.count()
    total_sales = Sale.query.filter_by(status='paid').count()
    total_revenue = sum(float(s.amount) for s in Sale.query.filter_by(status='paid').all())
    pending_withdraws = WithdrawRequest.query.filter_by(status='pending').count()

    return jsonify({
        'total_users': total_users,
        'total_tutors': total_tutors,
        'total_courses': total_courses,
        'total_sales': total_sales,
        'total_revenue': total_revenue,
        'pending_withdraws': pending_withdraws,
    })


@admin_bp.route('/users', methods=['GET'])
@role_required('admin')
def list_users():
    search = request.args.get('search', '')
    query = User.query.filter_by(role='student')
    if search:
        query = query.filter(or_(User.name.ilike(f'%{search}%'), User.email.ilike(f'%{search}%')))
    users = query.order_by(User.created_at.desc()).all()
    return jsonify({'users': [u.to_dict() for u in users]})


@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@role_required('admin')
def update_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    user.name = data.get('name', user.name)
    user.email = data.get('email', user.email)
    user.phone = data.get('phone', user.phone)
    user.bio = data.get('bio', user.bio)
    user.role = data.get('role', user.role)
    db.session.commit()
    return jsonify({'user': user.to_dict()})


@admin_bp.route('/tutors', methods=['GET'])
@role_required('admin')
def list_tutors():
    search = request.args.get('search', '')
    query = User.query.filter_by(role='tutor')
    if search:
        query = query.filter(or_(User.name.ilike(f'%{search}%'), User.email.ilike(f'%{search}%')))
    tutors = query.order_by(User.created_at.desc()).all()
    result = []
    for t in tutors:
        data = t.to_dict()
        courses = Course.query.filter_by(tutor_id=t.id).all()
        data['courses'] = []
        for c in courses:
            enrollments = Enrollment.query.filter_by(course_id=c.id, payment_status='paid').all()
            completed = sum(1 for e in enrollments if e.to_dict()['is_completed'])
            data['courses'].append({
                'id': c.id,
                'title': c.title,
                'total_buyers': len(enrollments),
                'total_completed': completed,
            })
        result.append(data)
    return jsonify({'tutors': result})


@admin_bp.route('/tutors/<int:tutor_id>', methods=['PUT'])
@role_required('admin')
def update_tutor(tutor_id):
    tutor = User.query.get_or_404(tutor_id)
    data = request.get_json()
    tutor.name = data.get('name', tutor.name)
    tutor.email = data.get('email', tutor.email)
    tutor.phone = data.get('phone', tutor.phone)
    tutor.bio = data.get('bio', tutor.bio)
    tutor.bank_name = data.get('bank_name', tutor.bank_name)
    tutor.bank_account = data.get('bank_account', tutor.bank_account)
    tutor.bank_holder = data.get('bank_holder', tutor.bank_holder)
    db.session.commit()
    return jsonify({'user': tutor.to_dict()})


@admin_bp.route('/courses', methods=['GET'])
@role_required('admin')
def list_courses():
    search = request.args.get('search', '')
    query = Course.query
    if search:
        query = query.filter(Course.title.ilike(f'%{search}%'))
    courses = query.order_by(Course.created_at.desc()).all()
    return jsonify({'courses': [c.to_dict() for c in courses]})


@admin_bp.route('/courses/<int:course_id>', methods=['PUT'])
@role_required('admin')
def update_course(course_id):
    course = Course.query.get_or_404(course_id)
    data = request.get_json()
    course.title = data.get('title', course.title)
    course.information = data.get('information', course.information)
    course.price = data.get('price', course.price)
    course.is_active = data.get('is_active', course.is_active)
    course.intro_video_url = data.get('intro_video_url', course.intro_video_url)
    course.thumbnail_url = data.get('thumbnail_url', course.thumbnail_url)

    if 'materials' in data:
        replace_course_materials(course_id, data['materials'])

    db.session.commit()
    return jsonify({'course': course.to_dict(include_materials=True)})


@admin_bp.route('/sales', methods=['GET'])
@role_required('admin')
def list_sales():
    search = request.args.get('search', '')
    status = request.args.get('status', '')
    date_from = request.args.get('date_from', '')
    date_to = request.args.get('date_to', '')
    course_id = request.args.get('course_id', '')

    query = Sale.query
    if search:
        query = query.join(User, Sale.user_id == User.id).join(
            Course, Sale.course_id == Course.id
        ).filter(or_(
            User.name.ilike(f'%{search}%'),
            Course.title.ilike(f'%{search}%')
        ))
    if status:
        query = query.filter(Sale.status == status)
    if course_id:
        query = query.filter(Sale.course_id == int(course_id))
    if date_from:
        query = query.filter(Sale.created_at >= datetime.fromisoformat(date_from))
    if date_to:
        query = query.filter(Sale.created_at <= datetime.fromisoformat(date_to + 'T23:59:59'))

    sales = query.order_by(Sale.created_at.desc()).all()
    return jsonify({'sales': [s.to_dict() for s in sales]})


@admin_bp.route('/sales/<int:sale_id>', methods=['PUT'])
@role_required('admin')
def update_sale(sale_id):
    sale = Sale.query.get_or_404(sale_id)
    data = request.get_json()
    new_status = data.get('status')
    if new_status in ('waiting_payment', 'paid', 'cancel'):
        sale.status = new_status
        if new_status == 'paid':
            enrollment = Enrollment.query.filter_by(
                user_id=sale.user_id, course_id=sale.course_id
            ).first()
            if enrollment:
                enrollment.payment_status = 'paid'
            else:
                db.session.add(Enrollment(
                    user_id=sale.user_id,
                    course_id=sale.course_id,
                    payment_status='paid'
                ))
        elif new_status == 'cancel':
            enrollment = Enrollment.query.filter_by(
                user_id=sale.user_id, course_id=sale.course_id
            ).first()
            if enrollment:
                enrollment.payment_status = 'cancel'
    db.session.commit()
    return jsonify({'sale': sale.to_dict()})


@admin_bp.route('/withdraws', methods=['GET'])
@role_required('admin')
def list_withdraws():
    status = request.args.get('status', '')
    query = WithdrawRequest.query
    if status:
        query = query.filter(WithdrawRequest.status == status)
    withdraws = query.order_by(WithdrawRequest.created_at.desc()).all()
    return jsonify({'withdraws': [w.to_dict() for w in withdraws]})


@admin_bp.route('/withdraws/<int:withdraw_id>', methods=['PUT'])
@role_required('admin')
def update_withdraw(withdraw_id):
    withdraw = WithdrawRequest.query.get_or_404(withdraw_id)
    data = request.get_json()
    new_status = data.get('status')
    if new_status in ('pending', 'paid', 'rejected'):
        withdraw.status = new_status
    if data.get('payment_proof_url'):
        withdraw.payment_proof_url = data['payment_proof_url']
    db.session.commit()
    return jsonify({'withdraw': withdraw.to_dict()})


@admin_bp.route('/community', methods=['GET'])
@role_required('admin')
def list_community():
    search = request.args.get('search', '')
    query = CommunityTopic.query.filter_by(parent_id=None)
    if search:
        query = query.filter(CommunityTopic.title.ilike(f'%{search}%'))
    topics = query.order_by(CommunityTopic.created_at.desc()).all()
    result = []
    for t in topics:
        data = t.to_dict()
        course = Course.query.get(t.course_id)
        data['course_title'] = course.title if course else None
        data['replies'] = [r.to_dict() for r in t.replies]
        result.append(data)
    return jsonify({'topics': result})


@admin_bp.route('/community/<int:topic_id>', methods=['DELETE'])
@role_required('admin')
def delete_topic(topic_id):
    topic = CommunityTopic.query.get_or_404(topic_id)
    CommunityTopic.query.filter_by(parent_id=topic_id).delete()
    db.session.delete(topic)
    db.session.commit()
    return jsonify({'message': 'Topic deleted'})


@admin_bp.route('/homepage-settings', methods=['GET'])
@role_required('admin')
def get_admin_homepage_settings():
    return jsonify({'settings': get_homepage_settings().to_dict()})


@admin_bp.route('/homepage-settings', methods=['PUT'])
@role_required('admin')
def update_homepage_settings():
    settings = get_homepage_settings()
    data = request.get_json() or {}
    settings.tagline = data.get('tagline', settings.tagline)
    settings.title = data.get('title', settings.title)
    settings.subtitle = data.get('subtitle', settings.subtitle)
    settings.cta_text = data.get('cta_text', settings.cta_text)
    if 'wallpaper_url' in data:
        settings.wallpaper_url = data.get('wallpaper_url') or None
    db.session.commit()
    return jsonify({'settings': settings.to_dict()})
