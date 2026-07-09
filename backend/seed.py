import os
import pymysql
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

conn = pymysql.connect(
    host=os.getenv('DB_HOST', '127.0.0.1'),
    user=os.getenv('DB_USER', 'root'),
    password=os.getenv('DB_PASSWORD', ''),
    database=os.getenv('DB_NAME', 'kayakarya_course'),
    port=int(os.getenv('DB_PORT', '3306')),
)
cursor = conn.cursor()

cursor.execute("SELECT id FROM users WHERE role='admin' LIMIT 1")
admin = cursor.fetchone()
if not admin:
    cursor.execute(
        "INSERT INTO users (email, name, google_id, role) VALUES (%s, %s, %s, %s)",
        ('admin@kayakarya.com', 'Admin KayaKarya', 'admin-local', 'admin')
    )
    conn.commit()
    cursor.execute("SELECT id FROM users WHERE role='admin' LIMIT 1")
    admin = cursor.fetchone()

admin_id = admin[0]

cursor.execute("SELECT id FROM users WHERE role='tutor' LIMIT 1")
tutor = cursor.fetchone()
if not tutor:
    cursor.execute(
        "INSERT INTO users (email, name, google_id, role, bio) VALUES (%s, %s, %s, %s, %s)",
        ('tutor@kayakarya.com', 'Budi Santoso', 'tutor-demo', 'tutor', 'Ilustrator profesional dengan 10 tahun pengalaman')
    )
    conn.commit()
    cursor.execute("SELECT id FROM users WHERE role='tutor' LIMIT 1")
    tutor = cursor.fetchone()

tutor_id = tutor[0]

cursor.execute("SELECT COUNT(*) FROM courses")
if cursor.fetchone()[0] == 0:
    courses = [
        ('Ilustrasi Digital untuk Pemula', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
         'Pelajari dasar-dasar ilustrasi digital dari nol. Course ini cocok untuk pemula yang ingin memulai karir sebagai ilustrator.',
         299000, tutor_id),
        ('Tipografi Kreatif', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
         'Eksplorasi seni tipografi dan lettering. Buat karya tipografi yang memukau.',
         199000, tutor_id),
        ('Fotografi Produk untuk E-Commerce', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
         'Teknik fotografi produk yang profesional untuk toko online Anda.',
         349000, tutor_id),
    ]
    for title, video, info, price, tid in courses:
        cursor.execute(
            "INSERT INTO courses (title, intro_video_url, information, price, tutor_id, is_active) VALUES (%s, %s, %s, %s, %s, 1)",
            (title, video, info, price, tid)
        )
    conn.commit()

    cursor.execute("SELECT id, title FROM courses")
    for course_id, title in cursor.fetchall():
        materials = [
            (f'Pengenalan {title}', 'Materi pembuka dan overview course', '', 0),
            (f'Teknik Dasar', 'Pelajari teknik dasar yang wajib dikuasai', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 1),
            (f'Praktik Langsung', 'Latihan langsung dengan project mini', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 2),
            (f'Project Akhir', 'Buat project akhir dan presentasikan', '', 3),
        ]
        for mat_title, desc, vid, order in materials:
            cursor.execute(
                "INSERT INTO materials (course_id, title, description, video_url, order_index) VALUES (%s, %s, %s, %s, %s)",
                (course_id, mat_title, desc, vid, order)
            )
    conn.commit()
    print("Seed data created successfully!")
else:
    print("Courses already exist, skipping seed.")

conn.close()
