#!/usr/bin/env python3
"""
Migrate database tables to kayakarya_course.

Usage:
  cd backend && source venv/bin/activate && python migrate.py
  cd backend && source venv/bin/activate && python migrate.py --sql
  cd backend && source venv/bin/activate && python migrate.py --seed
"""
import argparse
import json
import os
import sys
import time

import pymysql
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    'host': os.getenv('DB_HOST', '127.0.0.1'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', 'kayakarya_course'),
    'port': int(os.getenv('DB_PORT', '3306')),
}

LOG_PATH = '/home/ubuntu/kayakarya_course/.cursor/debug-749551.log'


def log_event(message, data=None, hypothesis_id='MIGRATE'):
    entry = {
        'sessionId': '749551',
        'hypothesisId': hypothesis_id,
        'location': 'migrate.py',
        'message': message,
        'data': data or {},
        'timestamp': int(time.time() * 1000),
        'runId': 'migrate',
    }
    os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
    with open(LOG_PATH, 'a') as f:
        f.write(json.dumps(entry) + '\n')


def create_database():
    conn = pymysql.connect(
        host=DB_CONFIG['host'],
        user=DB_CONFIG['user'],
        password=DB_CONFIG['password'],
        port=DB_CONFIG['port'],
    )
    try:
        with conn.cursor() as cur:
            cur.execute(
                f"CREATE DATABASE IF NOT EXISTS `{DB_CONFIG['database']}` "
                "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )
        conn.commit()
        print(f"✓ Database '{DB_CONFIG['database']}' ready")
        log_event('database created', {'database': DB_CONFIG['database']})
    finally:
        conn.close()


def run_sql_migration():
    sql_path = os.path.join(os.path.dirname(__file__), 'migrations', '001_init_schema.sql')
    with open(sql_path, 'r') as f:
        sql_content = f.read()

    conn = pymysql.connect(**DB_CONFIG)
    try:
        with conn.cursor() as cur:
            for statement in sql_content.split(';'):
                stmt = statement.strip()
                if stmt and not stmt.startswith('--'):
                    cur.execute(stmt)
        conn.commit()
        print('✓ SQL migration executed')
        log_event('sql migration done')
    finally:
        conn.close()


def run_orm_migration():
    from app import create_app
    from models import db, User

    app = create_app()
    with app.app_context():
        db.create_all()
        admin = User.query.filter_by(email='admin@kayakarya.com').first()
        if not admin:
            admin = User(
                email='admin@kayakarya.com',
                name='Admin KayaKarya',
                google_id='admin-local',
                role='admin',
            )
            db.session.add(admin)
            db.session.commit()
        tables = db.engine.table_names() if hasattr(db.engine, 'table_names') else []
        print(f'✓ ORM migration done — tables synced')
        log_event('orm migration done', {'method': 'create_all'})


def verify_tables():
    conn = pymysql.connect(**DB_CONFIG)
    try:
        with conn.cursor() as cur:
            cur.execute('SHOW TABLES')
            tables = [row[0] for row in cur.fetchall()]
        print(f'✓ Tables ({len(tables)}): {", ".join(tables)}')
        log_event('verify tables', {'count': len(tables), 'tables': tables})
        return tables
    finally:
        conn.close()


def run_seed():
    import seed as seed_module
    print('✓ Seed script executed')


def main():
    parser = argparse.ArgumentParser(description='Migrate KayaKarya Course database')
    parser.add_argument('--sql', action='store_true', help='Run SQL file migration')
    parser.add_argument('--seed', action='store_true', help='Run seed data after migration')
    args = parser.parse_args()

    print('=== KayaKarya Course Database Migration ===')
    print(f"Target: {DB_CONFIG['user']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}")
    print()

    create_database()

    if args.sql:
        run_sql_migration()
    else:
        run_orm_migration()

    tables = verify_tables()

    if args.seed:
        run_seed()

    expected = {
        'users', 'courses', 'materials', 'enrollments', 'material_progress',
        'community_topics', 'projects', 'project_images', 'project_likes',
        'project_comments', 'sales', 'withdraw_requests',
    }
    missing = expected - set(tables)
    if missing:
        print(f'⚠ Missing tables: {", ".join(missing)}')
        sys.exit(1)

    print()
    print('Migration completed successfully!')


if __name__ == '__main__':
    main()
