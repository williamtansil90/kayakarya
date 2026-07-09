from models import CommunityTopic


def topic_depth(topic):
    depth = 0
    current = topic
    while current.parent_id:
        depth += 1
        current = CommunityTopic.query.get(current.parent_id)
        if not current:
            break
    return depth


def count_topic_replies(topic_id):
    direct = CommunityTopic.query.filter_by(parent_id=topic_id).all()
    direct_ids = [r.id for r in direct]
    sub_count = 0
    if direct_ids:
        sub_count = CommunityTopic.query.filter(
            CommunityTopic.parent_id.in_(direct_ids)
        ).count()
    return len(direct) + sub_count


def topic_list_item(topic):
    return {
        'id': topic.id,
        'title': topic.title,
        'created_at': topic.created_at.isoformat() if topic.created_at else None,
        'reply_count': count_topic_replies(topic.id),
        'is_main_topic': topic.is_main_topic,
        'user_name': topic.user.name if topic.user else None,
    }


def enrich_topic_dict(topic):
    data = topic.to_dict()
    if topic.reply_to_id:
        mentioned = CommunityTopic.query.get(topic.reply_to_id)
        if mentioned and mentioned.user:
            data['reply_to_user_name'] = mentioned.user.name
    return data


def build_topic_thread(topic_id):
    root = CommunityTopic.query.filter_by(id=topic_id, parent_id=None).first_or_404()
    direct_replies = CommunityTopic.query.filter_by(
        parent_id=topic_id
    ).order_by(CommunityTopic.created_at.asc()).all()

    replies = []
    for reply in direct_replies:
        children = CommunityTopic.query.filter_by(
            parent_id=reply.id
        ).order_by(CommunityTopic.created_at.asc()).all()
        sub_reply = next((c for c in children if not c.reply_to_id), None)
        at_replies = [enrich_topic_dict(c) for c in children if c.reply_to_id]
        replies.append({
            **enrich_topic_dict(reply),
            'sub_reply': enrich_topic_dict(sub_reply) if sub_reply else None,
            'at_replies': at_replies,
        })

    return {
        'topic': enrich_topic_dict(root),
        'replies': replies,
    }
