from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    name = db.Column(db.String(255), nullable=False)
    avatar_url = db.Column(db.String(500))
    google_id = db.Column(db.String(255), unique=True)
    role = db.Column(db.Enum('student', 'tutor', 'admin'), default='student')
    phone = db.Column(db.String(50))
    bio = db.Column(db.Text)
    bank_name = db.Column(db.String(100))
    bank_account = db.Column(db.String(100))
    bank_holder = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    enrollments = db.relationship('Enrollment', backref='user', lazy=True)
    courses_taught = db.relationship('Course', backref='tutor', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'avatar_url': self.avatar_url,
            'role': self.role,
            'phone': self.phone,
            'bio': self.bio,
            'bank_name': self.bank_name,
            'bank_account': self.bank_account,
            'bank_holder': self.bank_holder,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Course(db.Model):
    __tablename__ = 'courses'
    id = db.Column(db.Integer, primary_key=True)
    tutor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    intro_video_url = db.Column(db.String(500))
    information = db.Column(db.Text)
    price = db.Column(db.Numeric(12, 2), default=0)
    thumbnail_url = db.Column(db.String(500))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    materials = db.relationship('Material', backref='course', lazy=True, order_by='Material.order_index')
    enrollments = db.relationship('Enrollment', backref='course', lazy=True)

    def to_dict(self, include_materials=False):
        data = {
            'id': self.id,
            'tutor_id': self.tutor_id,
            'tutor_name': self.tutor.name if self.tutor else None,
            'tutor_avatar': self.tutor.avatar_url if self.tutor else None,
            'title': self.title,
            'intro_video_url': self.intro_video_url,
            'information': self.information,
            'price': float(self.price) if self.price else 0,
            'thumbnail_url': self.thumbnail_url,
            'is_active': self.is_active,
            'total_buyers': len(self.enrollments),
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        if include_materials:
            data['materials'] = [m.to_dict() for m in self.materials]
        return data


class Material(db.Model):
    __tablename__ = 'materials'
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    video_url = db.Column(db.String(500))
    order_index = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    sub_materials = db.relationship(
        'SubMaterial', backref='material', lazy=True,
        order_by='SubMaterial.order_index', cascade='all, delete-orphan'
    )

    def to_dict(self, include_sub_materials=True):
        data = {
            'id': self.id,
            'course_id': self.course_id,
            'title': self.title,
            'description': self.description,
            'video_url': self.video_url,
            'order_index': self.order_index,
        }
        if include_sub_materials:
            data['sub_materials'] = [s.to_dict() for s in self.sub_materials]
        return data


class SubMaterial(db.Model):
    __tablename__ = 'sub_materials'
    id = db.Column(db.Integer, primary_key=True)
    material_id = db.Column(db.Integer, db.ForeignKey('materials.id', ondelete='CASCADE'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    video_url = db.Column(db.String(500))
    order_index = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'material_id': self.material_id,
            'title': self.title,
            'description': self.description,
            'video_url': self.video_url,
            'order_index': self.order_index,
        }


class Enrollment(db.Model):
    __tablename__ = 'enrollments'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    purchased_at = db.Column(db.DateTime, default=datetime.utcnow)
    payment_status = db.Column(
        db.Enum('waiting_payment', 'paid', 'cancel'), default='paid'
    )

    progress = db.relationship('MaterialProgress', backref='enrollment', lazy=True)

    def to_dict(self, include_progress=False):
        total_materials = Material.query.filter_by(course_id=self.course_id).count()
        completed = MaterialProgress.query.filter_by(
            user_id=self.user_id, completed=True
        ).join(Material).filter(Material.course_id == self.course_id).count()
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'course_id': self.course_id,
            'purchased_at': self.purchased_at.isoformat() if self.purchased_at else None,
            'payment_status': self.payment_status,
            'progress_percent': round((completed / total_materials * 100) if total_materials > 0 else 0, 1),
            'completed_count': completed,
            'total_materials': total_materials,
            'is_completed': total_materials > 0 and completed >= total_materials,
        }
        if include_progress:
            data['user'] = self.user.to_dict() if self.user else None
        return data


class MaterialProgress(db.Model):
    __tablename__ = 'material_progress'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    material_id = db.Column(db.Integer, db.ForeignKey('materials.id'), nullable=False)
    enrollment_id = db.Column(db.Integer, db.ForeignKey('enrollments.id'))
    completed = db.Column(db.Boolean, default=False)
    completed_at = db.Column(db.DateTime)

    material = db.relationship('Material', backref='progress_records')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'material_id': self.material_id,
            'completed': self.completed,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
        }


class CommunityTopic(db.Model):
    __tablename__ = 'community_topics'
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text)
    is_main_topic = db.Column(db.Boolean, default=False)
    parent_id = db.Column(db.Integer, db.ForeignKey('community_topics.id'))
    reply_to_id = db.Column(db.Integer, db.ForeignKey('community_topics.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref='topics')
    replies = db.relationship(
        'CommunityTopic',
        backref=db.backref('parent', remote_side=[id]),
        lazy=True,
        foreign_keys=[parent_id],
    )

    def to_dict(self, include_replies=False):
        data = {
            'id': self.id,
            'course_id': self.course_id,
            'user_id': self.user_id,
            'user_name': self.user.name if self.user else None,
            'user_avatar': self.user.avatar_url if self.user else None,
            'title': self.title,
            'content': self.content,
            'is_main_topic': self.is_main_topic,
            'parent_id': self.parent_id,
            'reply_to_id': self.reply_to_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        if include_replies:
            data['replies'] = [r.to_dict() for r in self.replies]
        return data


class Project(db.Model):
    __tablename__ = 'projects'
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    youtube_url = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref='projects')
    images = db.relationship('ProjectImage', backref='project', lazy=True)
    likes = db.relationship('ProjectLike', backref='project', lazy=True)
    comments = db.relationship('ProjectComment', backref='project', lazy=True)

    def to_dict(self, current_user_id=None):
        return {
            'id': self.id,
            'course_id': self.course_id,
            'user_id': self.user_id,
            'user_name': self.user.name if self.user else None,
            'user_avatar': self.user.avatar_url if self.user else None,
            'title': self.title,
            'description': self.description,
            'youtube_url': self.youtube_url,
            'images': [img.image_url for img in self.images],
            'like_count': len(self.likes),
            'liked_by_me': any(l.user_id == current_user_id for l in self.likes) if current_user_id else False,
            'comment_count': len(self.comments),
            'comments': [c.to_dict() for c in self.comments],
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class ProjectImage(db.Model):
    __tablename__ = 'project_images'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    image_url = db.Column(db.String(500), nullable=False)


class ProjectLike(db.Model):
    __tablename__ = 'project_likes'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)


class ProjectComment(db.Model):
    __tablename__ = 'project_comments'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref='project_comments')

    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'user_id': self.user_id,
            'user_name': self.user.name if self.user else None,
            'user_avatar': self.user.avatar_url if self.user else None,
            'content': self.content,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Sale(db.Model):
    __tablename__ = 'sales'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    tutor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    status = db.Column(db.Enum('waiting_payment', 'paid', 'cancel'), default='waiting_payment')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship('User', foreign_keys=[user_id], backref='purchases')
    course = db.relationship('Course', backref='sales')
    tutor = db.relationship('User', foreign_keys=[tutor_id])

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_name': self.user.name if self.user else None,
            'course_id': self.course_id,
            'course_title': self.course.title if self.course else None,
            'tutor_id': self.tutor_id,
            'tutor_name': self.tutor.name if self.tutor else None,
            'amount': float(self.amount),
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class HomepageSettings(db.Model):
    __tablename__ = 'homepage_settings'
    id = db.Column(db.Integer, primary_key=True)
    tagline = db.Column(db.String(255), default='Belajar Kreatif, Raih Karya')
    title = db.Column(db.String(255), default='Temukan Course Kreatif Terbaik')
    subtitle = db.Column(db.Text, default='Belajar langsung dari para ahli. Dari desain, ilustrasi, hingga fotografi.')
    cta_text = db.Column(db.String(255), default='Mulai dengan Google Account')
    wallpaper_url = db.Column(db.String(500))
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'tagline': self.tagline,
            'title': self.title,
            'subtitle': self.subtitle,
            'cta_text': self.cta_text,
            'wallpaper_url': self.wallpaper_url,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class WithdrawRequest(db.Model):
    __tablename__ = 'withdraw_requests'
    id = db.Column(db.Integer, primary_key=True)
    tutor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    status = db.Column(db.Enum('pending', 'paid', 'rejected'), default='pending')
    payment_proof_url = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tutor = db.relationship('User', backref='withdraw_requests')

    def to_dict(self):
        return {
            'id': self.id,
            'tutor_id': self.tutor_id,
            'tutor_name': self.tutor.name if self.tutor else None,
            'tutor_email': self.tutor.email if self.tutor else None,
            'bank_name': self.tutor.bank_name if self.tutor else None,
            'bank_account': self.tutor.bank_account if self.tutor else None,
            'bank_holder': self.tutor.bank_holder if self.tutor else None,
            'amount': float(self.amount),
            'status': self.status,
            'payment_proof_url': self.payment_proof_url,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
