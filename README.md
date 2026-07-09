# KayaKarya Course

Platform pembelajaran kreatif terinspirasi Domestika.

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS (port 8701)
- **Backend**: Flask Python (port 8702)
- **Database**: MySQL (kayakarya_course)

## Docker Deployment (Production)

### Prerequisites
- Docker & Docker Compose installed
- DNS `kayakarya.com` → server IP
- Google OAuth: add `https://kayakarya.com` ke Authorized JavaScript origins

### Quick Start (Domain kayakarya.com)

```bash
# 1. Setup environment
cp .env.example .env
# Edit .env dengan kredensial database & Google OAuth

# 2. Pastikan DNS kayakarya.com mengarah ke IP server ini

# 3. Jalankan Docker + nginx domain (satu perintah)
chmod +x deploy/start-docker.sh
./deploy/start-docker.sh
```

Atau manual:

```bash
docker compose up -d --build
sudo bash deploy/setup-nginx.sh   # proxy kayakarya.com -> 127.0.0.1:8701
```

Development (expose backend juga):

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

### Deploy via Coolify / PaaS

| Setting | Nilai |
|---------|-------|
| Frontend port | `8701:80` |
| Backend internal port | `8702` |
| Env file | `.env` dengan `GOOGLE_CLIENT_ID`, `DB_*`, dll |

Set environment variable `GOOGLE_CLIENT_ID` di panel Coolify, bukan hardcode di compose.

### Architecture

| Service | Container | Port |
|---------|-----------|------|
| Backend (Flask/Gunicorn) | `backend` | internal 8702 |
| Frontend (React/Nginx) | `web` | host `8701` |
| Host Nginx (opsional) | kayakarya.com | 80 → proxy ke `8701` |

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

### Backend (port 8702)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

### Frontend (port 8701)

```bash
cd frontend
npm install
npm run dev
```

## URLs

| Area | URL |
|------|-----|
| Student Home | http://localhost:8701/ |
| My Courses | http://localhost:8701/my-courses |
| Tutor | http://localhost:8701/tutor |
| Admin | http://localhost:8701/admin |
| API Health | http://localhost:8702/api/health |

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

Client ID sudah dikonfigurasi. Pastikan `http://localhost:8701` ditambahkan di Google Cloud Console → Authorized JavaScript origins.

## Admin Default

Email: `admin@kayakarya.com` (login via Google, lalu ubah role ke admin di database jika perlu)
