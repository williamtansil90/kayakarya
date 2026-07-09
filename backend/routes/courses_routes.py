from datetime import datetime
from flask import Blueprint, request, jsonify, g
from models import (
    db, Course, Material, Enrollment, MaterialProgress,
    CommunityTopic, Project, ProjectImage, ProjectLike, ProjectComment, Sale
)
from auth import login_required, role_required
from community_utils import topic_list_item, build_topic_thread, topic_depth, count_topic_replies

courses_bp = Blueprint('courses', __name__)


@courses_bp.route('/', methods=['GET'])
def list_courses():
    search = request.args.get('search', '')
    query = Course.query.filter_by(is_active=True)
    if search:
        query = query.filter(Course.title.ilike(f'%{search}%'))
    courses = query.order_by(Course.created_at.desc()).all()
    return jsonify({'courses': [c.to_dict() for c in courses]})


@courses_bp.route('/<int:course_id>', methods=['GET'])
def get_course(course_id):
    course = Course.query.get_or_404(course_id)
    user_id = request.headers.get('X-User-Id')
    enrolled = False
    progress_data = []

    if user_id:
        enrollment = Enrollment.query.filter_by(
            user_id=int(user_id), course_id=course_id, payment_status='paid'
        ).first()
        enrolled = enrollment is not None
        if enrolled:
            materials = Material.query.filter_by(course_id=course_id).all()
            for mat in materials:
                prog = MaterialProgress.query.filter_by(
                    user_id=int(user_id), material_id=mat.id
                ).first()
                progress_data.append({
                    'material_id': mat.id,
                    'completed': prog.completed if prog else False,
                })

    data = course.to_dict(include_materials=True)
    if not enrolled:
        data['materials'] = [
            {
                'id': m['id'],
                'title': m['title'],
                'description': m['description'],
                'order_index': m['order_index'],
                'sub_materials': [
                    {
                        'id': s['id'],
                        'title': s['title'],
                        'description': s['description'],
                        'order_index': s['order_index'],
                    }
                    for s in m.get('sub_materials', [])
                ],
            }
            for m in data.get('materials', [])
        ]
    data['enrolled'] = enrolled
    data['progress'] = progress_data
    return jsonify({'course': data})


@courses_bp.route('/<int:course_id>/buy', methods=['POST'])
@login_required
def buy_course(course_id):
    course = Course.query.get_or_404(course_id)
    user = g.current_user

    existing = Enrollment.query.filter_by(user_id=user.id, course_id=course_id).first()
    if existing and existing.payment_status == 'paid':
        return jsonify({'error': 'Already enrolled'}), 400

    if existing:
        existing.payment_status = 'paid'
        enrollment = existing
    else:
        enrollment = Enrollment(user_id=user.id, course_id=course_id, payment_status='paid')
        db.session.add(enrollment)

    sale = Sale(
        user_id=user.id,
        course_id=course_id,
        tutor_id=course.tutor_id,
        amount=course.price,
        status='paid'
    )
    db.session.add(sale)
    db.session.commit()
    return jsonify({'enrollment': enrollment.to_dict(), 'message': 'Course purchased successfully'})


@courses_bp.route('/my-courses', methods=['GET'])
@login_required
def my_courses():
    enrollments = Enrollment.query.filter_by(
        user_id=g.current_user.id, payment_status='paid'
    ).all()
    result = []
    for e in enrollments:
        course_data = e.course.to_dict()
        enrollment_data = e.to_dict()
        enrollment_data['enrollment_id'] = enrollment_data.pop('id')
        course_data.update(enrollment_data)
        result.append(course_data)
    return jsonify({'courses': result})


@courses_bp.route('/<int:course_id>/progress/<int:material_id>', methods=['POST'])
@login_required
def mark_progress(course_id, material_id):
    user = g.current_user
    enrollment = Enrollment.query.filter_by(
        user_id=user.id, course_id=course_id, payment_status='paid'
    ).first()
    if not enrollment:
        return jsonify({'error': 'Not enrolled'}), 403

    data = request.get_json() or {}
    completed = data.get('completed', True)

    prog = MaterialProgress.query.filter_by(user_id=user.id, material_id=material_id).first()
    if not prog:
        prog = MaterialProgress(
            user_id=user.id,
            material_id=material_id,
            enrollment_id=enrollment.id,
            completed=completed,
            completed_at=datetime.utcnow() if completed else None
        )
        db.session.add(prog)
    else:
        prog.completed = completed
        prog.completed_at = datetime.utcnow() if completed else None

    db.session.commit()
    return jsonify({'progress': prog.to_dict()})


# Community
@courses_bp.route('/<int:course_id>/community', methods=['GET'])
def get_community(course_id):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    per_page = min(max(per_page, 1), 50)

    query = CommunityTopic.query.filter_by(
        course_id=course_id, parent_id=None
    ).order_by(CommunityTopic.is_main_topic.desc(), CommunityTopic.created_at.desc())

    total = query.count()
    topics = query.offset((page - 1) * per_page).limit(per_page).all()

    return jsonify({
        'topics': [topic_list_item(t) for t in topics],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': total,
            'pages': max(1, (total + per_page - 1) // per_page),
        },
    })


@courses_bp.route('/<int:course_id>/community/<int:topic_id>', methods=['GET'])
def get_community_topic(course_id, topic_id):
    root = CommunityTopic.query.filter_by(
        id=topic_id, course_id=course_id, parent_id=None
    ).first_or_404()
    return jsonify(build_topic_thread(root.id))


@courses_bp.route('/<int:course_id>/community', methods=['POST'])
@login_required
def create_topic(course_id):
    course = Course.query.get_or_404(course_id)
    user = g.current_user
    data = request.get_json()

    enrollment = Enrollment.query.filter_by(
        user_id=user.id, course_id=course_id, payment_status='paid'
    ).first()
    is_tutor = course.tutor_id == user.id
    if not enrollment and not is_tutor:
        return jsonify({'error': 'Must be enrolled or tutor'}), 403

    parent_id = data.get('parent_id')
    reply_to_id = data.get('reply_to_id')
    title = data.get('title', 'Reply')
    content = data.get('content', '')

    if reply_to_id:
        sub = CommunityTopic.query.get_or_404(reply_to_id)
        if sub.course_id != course_id or topic_depth(sub) != 2:
            return jsonify({'error': 'Invalid reply target'}), 400
        parent_id = sub.parent_id
        mention_name = sub.user.name if sub.user else 'user'
        if not content.strip().startswith('@'):
            content = f'@{mention_name} {content.strip()}'
        title = 'Reply'
    elif parent_id:
        parent = CommunityTopic.query.get_or_404(parent_id)
        if parent.course_id != course_id:
            return jsonify({'error': 'Invalid parent'}), 400
        depth = topic_depth(parent)
        if depth == 0:
            title = data.get('title', 'Reply')
        elif depth == 1:
            existing_sub = CommunityTopic.query.filter_by(
                parent_id=parent.id, reply_to_id=None
            ).first()
            if existing_sub:
                return jsonify({'error': 'Sub balasan sudah ada untuk balasan ini'}), 400
            title = 'Reply'
        else:
            return jsonify({'error': 'Invalid parent depth'}), 400
    else:
        is_main = data.get('is_main_topic', False) and is_tutor
        topic = CommunityTopic(
            course_id=course_id,
            user_id=user.id,
            title=title,
            content=content,
            is_main_topic=is_main,
        )
        db.session.add(topic)
        db.session.commit()
        return jsonify({'topic': topic.to_dict()}), 201

    topic = CommunityTopic(
        course_id=course_id,
        user_id=user.id,
        title=title,
        content=content,
        parent_id=parent_id,
        reply_to_id=reply_to_id,
    )
    db.session.add(topic)
    db.session.commit()
    return jsonify({'topic': topic.to_dict()}), 201


# Projects
@courses_bp.route('/<int:course_id>/projects', methods=['GET'])
def get_projects(course_id):
    user_id = request.headers.get('X-User-Id')
    uid = int(user_id) if user_id else None
    projects = Project.query.filter_by(course_id=course_id).order_by(Project.created_at.desc()).all()
    return jsonify({'projects': [p.to_dict(current_user_id=uid) for p in projects]})


@courses_bp.route('/<int:course_id>/projects', methods=['POST'])
@login_required
def create_project(course_id):
    user = g.current_user
    enrollment = Enrollment.query.filter_by(
        user_id=user.id, course_id=course_id, payment_status='paid'
    ).first()
    if not enrollment:
        return jsonify({'error': 'Must be enrolled'}), 403

    data = request.get_json()
    images = data.get('images', [])[:10]

    project = Project(
        course_id=course_id,
        user_id=user.id,
        title=data['title'],
        description=data.get('description', ''),
        youtube_url=data.get('youtube_url', '')
    )
    db.session.add(project)
    db.session.flush()

    for img_url in images:
        db.session.add(ProjectImage(project_id=project.id, image_url=img_url))

    db.session.commit()
    return jsonify({'project': project.to_dict(current_user_id=user.id)}), 201


@courses_bp.route('/projects/<int:project_id>/like', methods=['POST'])
@login_required
def toggle_like(project_id):
    user = g.current_user
    project = Project.query.get_or_404(project_id)
    existing = ProjectLike.query.filter_by(project_id=project_id, user_id=user.id).first()
    if existing:
        db.session.delete(existing)
        liked = False
    else:
        db.session.add(ProjectLike(project_id=project_id, user_id=user.id))
        liked = True
    db.session.commit()
    count = ProjectLike.query.filter_by(project_id=project_id).count()
    return jsonify({'liked': liked, 'like_count': count})


@courses_bp.route('/projects/<int:project_id>/comments', methods=['POST'])
@login_required
def add_comment(project_id):
    user = g.current_user
    data = request.get_json()
    comment = ProjectComment(
        project_id=project_id,
        user_id=user.id,
        content=data['content']
    )
    db.session.add(comment)
    db.session.commit()
    return jsonify({'comment': comment.to_dict()}), 201
