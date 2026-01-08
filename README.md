# Backend Finger - Sistem Rekap Absensi Kampus

Backend REST API untuk Sistem Rekap Absensi Kampus dengan integrasi mesin fingerprint ADMS.

## 🚀 Fitur Utama

- **Autentikasi JWT** - Access & Refresh tokens untuk keamanan
- **Integrasi ADMS** - Terima data dari mesin fingerprint
- **Manajemen Absensi** - CRUD data absensi dengan filtering
- **Dashboard Analytics** - Statistik dan laporan absensi
- **Export Data** - Excel, PDF, CSV export
- **Swagger Documentation** - API docs interaktif
- **Audit Logging** - Logging semua aktivitas admin
- **Rate Limiting** - Perlindungan terhadap abuse
- **Security Headers** - Helmet.js untuk keamanan

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL
- **ORM**: Sequelize
- **Authentication**: JWT (jsonwebtoken)
- **Security**: Helmet, CORS, bcrypt
- **Validation**: express-validator
- **Logging**: Winston
- **Documentation**: Swagger OpenAPI 3.0

## 📁 Struktur Proyek

```
backend-finger/
├── src/
│   ├── server.js           # Entry point aplikasi
│   ├── app.js             # Express app utama
│   ├── config/
│   │   ├── database.js    # Konfigurasi Sequelize
│   │   └── swagger.js     # Konfigurasi Swagger
│   ├── controllers/       # Business logic
│   │   ├── auth.controller.js
│   │   ├── attendance.controller.js
│   │   ├── dashboard.controller.js
│   │   ├── export.controller.js
│   │   └── adms.controller.js
│   ├── models/           # Database models
│   │   ├── Admin.js
│   │   ├── Attendance.js
│   │   ├── Device.js
│   │   └── index.js
│   ├── routes/           # API routes
│   │   ├── auth.routes.js
│   │   ├── attendance.routes.js
│   │   ├── dashboard.routes.js
│   │   ├── export.routes.js
│   │   └── adms.routes.js
│   ├── middlewares/      # Custom middlewares
│   │   └── auth.middleware.js
│   ├── utils/            # Utilities
│   │   ├── jwt.js
│   │   └── logger.js
│   └── services/         # Business services
│       └── exportService.js
├── scripts/
│   ├── seed-admin.js     # Script buat admin default
│   └── setup_database.sql
├── logs/                 # Log files
├── exports/              # Export files
└── package.json
```

## 🚀 Instalasi & Setup

### Prerequisites
- Node.js (v14 atau lebih baru)
- MySQL (v5.7 atau lebih baru)
- Git

### 1. Clone Repository
```bash
git clone https://github.com/dbscoding/backend-finger.git
cd backend-finger
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Database
```bash
# Pastikan MySQL server running
# Buat database 'finger_db'
mysql -u root -p
CREATE DATABASE finger_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;
```

### 4. Konfigurasi Environment
Buat file `.env` di root directory:
```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=finger_db
DB_PORT=3306

# JWT
JWT_ACCESS_SECRET=your_super_secret_access_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000
```

### 5. Seed Admin User
```bash
node scripts/seed-admin.js
```

### 6. Start Server
```bash
# Development
npm run dev

# Production
npm start
```

## 🔑 Admin Default

Setelah menjalankan seed script, Anda bisa login dengan:
- **Username**: `admin`
- **Password**: `admin123`
- **Email**: `admin@kampus.edu`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - Login admin
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout admin

### Attendance Management
- `GET /api/attendance` - List data absensi (dengan filter)
- `GET /api/attendance/summary` - Ringkasan absensi
- `GET /api/attendance/monthly/:year/:month` - Laporan bulanan
- `PUT /api/attendance/:id` - Update data absensi
- `DELETE /api/attendance/:id` - Hapus data absensi (soft delete)

### Dashboard
- `GET /api/dashboard/stats` - Statistik dashboard
- `GET /api/dashboard/recent` - Data absensi terbaru

### Export
- `GET /api/export/excel` - Export ke Excel
- `GET /api/export/pdf` - Export ke PDF
- `GET /api/export/csv` - Export ke CSV

### ADMS Integration
- `POST /adms/push` - Terima data dari mesin fingerprint

## 🔒 Keamanan

- **JWT Authentication** dengan Access & Refresh tokens
- **Password Hashing** menggunakan bcrypt (12 rounds)
- **Rate Limiting** - 100 req/15min, auth: 5 req/15min
- **Helmet Security Headers**
- **CORS Protection**
- **Input Validation & Sanitization**
- **SQL Injection Prevention**
- **Audit Logging** untuk compliance

## 📊 Testing API

### Health Check
```bash
curl http://localhost:3000/health
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Swagger Documentation
Kunjungi: `http://localhost:3000/api/docs`

## 🔧 Development Scripts

```bash
# Start development server dengan nodemon
npm run dev

# Start production server
npm start

# PM2 commands
npm run pm2:start    # Start dengan PM2
npm run pm2:stop     # Stop PM2
npm run pm2:restart  # Restart PM2
npm run pm2:delete   # Delete PM2 process
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | Database host | localhost |
| `DB_USER` | Database user | root |
| `DB_PASSWORD` | Database password | - |
| `DB_NAME` | Database name | finger_db |
| `DB_PORT` | Database port | 3306 |
| `JWT_ACCESS_SECRET` | JWT access token secret | - |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | - |
| `JWT_ACCESS_EXPIRES_IN` | Access token expiry | 15m |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | 7d |
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment | development |
| `CORS_ORIGIN` | CORS origin | http://localhost:3000 |

## 🗄️ Database Schema

### Tabel Admin
```sql
- id (Primary Key)
- username (Unique)
- password_hash
- email
- role (admin)
- is_active
- last_login
- created_at, updated_at
```

### Tabel Attendance
```sql
- id (Primary Key)
- cloud_id
- device_id
- user_id (NIP)
- nama
- nip
- jabatan (DOSEN/KARYAWAN)
- tanggal_absensi
- waktu_absensi
- tipe_absensi (MASUK/PULANG)
- verifikasi
- tanggal_upload
- is_deleted (Soft delete)
- created_at, updated_at
```

### Tabel Devices
```sql
- id (Primary Key)
- device_id (Unique)
- serial_number (Unique)
- ip_address
- api_key
- location
- faculty
- is_active
- last_seen
- created_at, updated_at
```

## 🤝 Contributing

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Contact

**Nama Proyek**: Backend Finger - Sistem Rekap Absensi Kampus
**Repository**: [https://github.com/dbscoding/backend-finger](https://github.com/dbscoding/backend-finger)

---

**⚡ Dibuat dengan ❤️ untuk kemajuan teknologi absensi kampus**
