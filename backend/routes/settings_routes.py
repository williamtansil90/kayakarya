from flask import Blueprint, jsonify
from models import HomepageSettings

settings_bp = Blueprint('settings', __name__)

DEFAULTS = {
    'tagline': 'Belajar Kreatif, Raih Karya',
    'title': 'Temukan Course Kreatif Terbaik',
    'subtitle': 'Belajar langsung dari para ahli. Dari desain, ilustrasi, hingga fotografi.',
    'cta_text': 'Mulai dengan Google Account',
    'wallpaper_url': None,
}


def get_homepage_settings():
    settings = HomepageSettings.query.first()
    if not settings:
        settings = HomepageSettings(**DEFAULTS)
        from models import db
        db.session.add(settings)
        db.session.commit()
    return settings


@settings_bp.route('/homepage', methods=['GET'])
def get_homepage():
    return jsonify({'settings': get_homepage_settings().to_dict()})
