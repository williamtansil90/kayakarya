from models import db, Material, SubMaterial, MaterialProgress


def add_materials_to_course(course_id, materials_data):
    for i, mat in enumerate(materials_data):
        material = Material(
            course_id=course_id,
            title=mat['title'],
            description=mat.get('description', ''),
            video_url=mat.get('video_url', ''),
            order_index=i,
        )
        db.session.add(material)
        db.session.flush()

        for j, sub in enumerate(mat.get('sub_materials', [])):
            if not sub.get('title', '').strip():
                continue
            db.session.add(SubMaterial(
                material_id=material.id,
                title=sub['title'],
                description=sub.get('description', ''),
                video_url=sub.get('video_url', ''),
                order_index=j,
            ))


def replace_course_materials(course_id, materials_data):
    existing_ids = [
        m.id for m in Material.query.filter_by(course_id=course_id).all()
    ]
    if existing_ids:
        MaterialProgress.query.filter(
            MaterialProgress.material_id.in_(existing_ids)
        ).delete(synchronize_session=False)
    Material.query.filter_by(course_id=course_id).delete()

    add_materials_to_course(course_id, materials_data)
