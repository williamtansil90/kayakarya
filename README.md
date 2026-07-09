# KayaKarya Course

Platform pembelajaran kreatif terinspirasi Domestika.

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS (port 8002)
- **Backend**: Flask Python (port 8001)
- **Database**: MySQL (kayakarya_course)

## Docker Deployment (Production)

### Prerequisites
- Docker & Docker Compose installed
- DNS `kayakarya.com` → server IP
- Google OAuth: add `https://kayakarya.com` ke Authorized JavaScript origins

### Quick Start

```bash
# 1. Setup environment
cp .env.example .env
# Edit .env dengan kredensial database & Google OAuth

# 2. Build & run containers (production — port 80)
docker compose up -d --build

# Atau development (backend 8001, web 18080)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

### Architecture

| Service | Container | Port |
|---------|-----------|------|
| Backend (Flask/Gunicorn) | `backend` | internal 8001 |
| Frontend (React/Nginx) | `web` | host `80` (atau `18080` di dev) |
| Host Nginx (opsional) | kayakarya.com | 80 → proxy ke web |

### URLs (Production)

| Area | URL |
|------|-----|
| Student Home | https://kayakarya.com/ |
| Tutor | https://kayakarya.com/tutor |
| Admin | https://kayakarya.com/admin |
| API Health | https://kayakarya.com/api/health |

### SSL (HTTPS)

Setelah DNS aktif, jalankan certbot:

```bash
sudo certbot certonly --webroot -w /var/www/certbot -d kayakarya.com -d www.kayakarya.com
```

Lalu tambahkan blok SSL di `deploy/nginx/kayakarya.com.conf`.

### Useful Commands

```bash
docker compose logs -f          # View logs
docker compose restart backend # Restart backend
docker compose down           # Stop all
```

## Setup (Development)

### Database

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS kayakarya_course;"
```

### Backend (port 8001)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

### Frontend (port 8002)

```bash
cd frontend
npm install
npm run dev
```

## URLs

| Area | URL |
|------|-----|
| Student Home | http://localhost:8002/ |
| My Courses | http://localhost:8002/my-courses |
| Tutor | http://localhost:8002/tutor |
| Admin | http://localhost:8002/admin |
| API Health | http://localhost:8001/api/health |

## Features

### Student
- Register/Login dengan Google Account
- Browse semua course
- Course detail (info, materi, content dengan progress, community, project)
- My Courses dengan progress tracking

### Tutor (/tutor)
- Register/Login dengan Google Account
- Buat & kelola course (judul, video pembukaan, info, harga, materi)
- Lihat statistik pembeli & progress siswa
- Community management
- Penjualan & request withdraw

### Admin (/admin)
- Dashboard penjualan
- Kelola users, tutors, courses
- Kelola penjualan (ubah status: paid/cancel/waiting)
- Kelola withdraw request (upload bukti pembayaran)
- Kelola community

## Google OAuth

Client ID sudah dikonfigurasi. Pastikan `http://localhost:8002` ditambahkan di Google Cloud Console → Authorized JavaScript origins.

## Admin Default

Email: `admin@kayakarya.com` (login via Google, lalu ubah role ke admin di database jika perlu)
