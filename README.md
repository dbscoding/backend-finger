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

## 🔌 Frontend Integration Guide

### Base URL
```
Development: http://localhost:3000
Production: https://your-api-domain.com
```

### Authentication Flow

#### 1. Login
```javascript
const login = async (username, password) => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok) {
      // Simpan tokens di localStorage atau secure storage
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      return data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};
```

#### 2. Using Access Token
```javascript
const apiCall = async (endpoint, options = {}) => {
  const accessToken = localStorage.getItem('accessToken');

  const defaultOptions = {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  };

  const response = await fetch(endpoint, { ...defaultOptions, ...options });

  // Jika token expired, coba refresh
  if (response.status === 401) {
    const newToken = await refreshToken();
    if (newToken) {
      return apiCall(endpoint, options); // Retry dengan token baru
    }
  }

  return response;
};
```

#### 3. Refresh Token
```javascript
const refreshToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');

    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      return data.accessToken;
    } else {
      // Refresh token expired, redirect ke login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
      return null;
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
    return null;
  }
};
```

### API Response Format

#### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  },
  "meta": {
    "timestamp": "2024-01-08T10:00:00.000Z",
    "requestId": "req-123456"
  }
}
```

#### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "field": "username",
      "reason": "Username is required"
    }
  },
  "meta": {
    "timestamp": "2024-01-08T10:00:00.000Z",
    "requestId": "req-123456"
  }
}
```

### Common Endpoints Usage

#### Get Attendance List with Filters
```javascript
const getAttendance = async (filters = {}) => {
  const queryParams = new URLSearchParams({
    page: filters.page || 1,
    limit: filters.limit || 10,
    startDate: filters.startDate,
    endDate: filters.endDate,
    nip: filters.nip,
    device_id: filters.device_id,
    ...filters
  });

  const response = await apiCall(`/api/attendance?${queryParams}`);
  const data = await response.json();

  if (response.ok) {
    return {
      data: data.data,
      pagination: data.pagination,
      summary: data.summary
    };
  } else {
    throw new Error(data.message);
  }
};
```

#### Get Dashboard Stats
```javascript
const getDashboardStats = async () => {
  const response = await apiCall('/api/dashboard/stats');
  const data = await response.json();

  if (response.ok) {
    return data.data; // { totalEmployees, totalAttendance, todayAttendance, etc. }
  } else {
    throw new Error(data.message);
  }
};
```

#### Export Data
```javascript
const exportData = async (format, filters = {}) => {
  const queryParams = new URLSearchParams({
    format, // 'excel', 'pdf', 'csv'
    startDate: filters.startDate,
    endDate: filters.endDate,
    ...filters
  });

  // Untuk export, gunakan window.open atau download file
  window.open(`/api/export/${format}?${queryParams}`, '_blank');
};
```

### Pagination

Semua list endpoints menggunakan pagination dengan format:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Filtering Parameters

#### Attendance Filters
- `startDate`: Tanggal mulai (YYYY-MM-DD)
- `endDate`: Tanggal akhir (YYYY-MM-DD)
- `nip`: Filter berdasarkan NIP
- `device_id`: Filter berdasarkan device
- `jabatan`: Filter berdasarkan jabatan (DOSEN/KARYAWAN)
- `tipe_absensi`: Filter berdasarkan tipe (MASUK/PULANG)

### Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Input validation failed |
| `AUTHENTICATION_ERROR` | Invalid or missing token |
| `AUTHORIZATION_ERROR` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTERNAL_ERROR` | Server internal error |

### Rate Limiting

- **General endpoints**: 100 requests per 15 minutes
- **Authentication endpoints**: 5 requests per 15 minutes
- **Export endpoints**: 10 requests per hour

### CORS Configuration

Untuk development, pastikan frontend berjalan di:
- `http://localhost:3000` (default)
- Atau tambahkan origin Anda ke environment variable `CORS_ORIGIN`

### File Structure untuk Frontend

```
frontend/
├── src/
│   ├── services/
│   │   ├── api.js           # Base API configuration
│   │   ├── auth.js          # Authentication service
│   │   ├── attendance.js    # Attendance API calls
│   │   ├── dashboard.js     # Dashboard API calls
│   │   └── export.js        # Export functionality
│   ├── hooks/
│   │   ├── useAuth.js       # Authentication hook
│   │   └── useApi.js        # API call hook
│   └── utils/
│       └── constants.js     # API endpoints constants
```

### Sample API Service

```javascript
// src/services/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const accessToken = localStorage.getItem('accessToken');

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
        ...options.headers,
      },
      ...options,
    };

    let response = await fetch(url, config);

    // Handle token refresh
    if (response.status === 401 && accessToken) {
      const newToken = await this.refreshToken();
      if (newToken) {
        config.headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(url, config);
      }
    }

    return response;
  }

  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        return data.accessToken;
      } else {
        this.logout();
        return null;
      }
    } catch (error) {
      this.logout();
      return null;
    }
  }

  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
  }

  // Helper methods
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url);
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

## 📋 Data Models & Validation

### Admin Model
```javascript
{
  id: number,           // Primary key
  username: string,     // Unique, required, min: 3, max: 50
  email: string,        // Unique, required, valid email format
  role: string,         // Default: 'admin'
  is_active: boolean,   // Default: true
  last_login: Date,     // Nullable
  created_at: Date,
  updated_at: Date
}
```

### Attendance Model
```javascript
{
  id: number,           // Primary key
  cloud_id: string,     // From ADMS
  device_id: string,    // Device identifier
  user_id: string,      // NIP employee
  nama: string,         // Employee name
  nip: string,          // Employee NIP
  jabatan: string,      // 'DOSEN' or 'KARYAWAN'
  tanggal_absensi: Date,// Attendance date (YYYY-MM-DD)
  waktu_absensi: string,// Attendance time (HH:mm:ss)
  tipe_absensi: string, // 'MASUK' or 'PULANG'
  verifikasi: string,   // Verification status
  tanggal_upload: Date, // Upload timestamp
  is_deleted: boolean,  // Soft delete flag
  created_at: Date,
  updated_at: Date
}
```

### Device Model
```javascript
{
  id: number,           // Primary key
  device_id: string,    // Unique device identifier
  serial_number: string,// Unique serial number
  ip_address: string,   // Device IP address
  api_key: string,      // API key for authentication
  location: string,     // Device location
  faculty: string,      // Faculty name
  is_active: boolean,   // Device status
  last_seen: Date,      // Last communication
  created_at: Date,
  updated_at: Date
}
```

### Validation Rules

#### Login Request
```javascript
{
  username: {
    type: 'string',
    required: true,
    minLength: 3,
    maxLength: 50
  },
  password: {
    type: 'string',
    required: true,
    minLength: 6
  }
}
```

#### Attendance Update
```javascript
{
  nama: {
    type: 'string',
    required: true,
    maxLength: 100
  },
  nip: {
    type: 'string',
    required: true,
    pattern: /^[0-9]+$/  // Only numbers
  },
  jabatan: {
    type: 'string',
    required: true,
    enum: ['DOSEN', 'KARYAWAN']
  },
  tanggal_absensi: {
    type: 'date',
    required: true,
    format: 'YYYY-MM-DD'
  },
  waktu_absensi: {
    type: 'string',
    required: true,
    pattern: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/
  },
  tipe_absensi: {
    type: 'string',
    required: true,
    enum: ['MASUK', 'PULANG']
  }
}
```

### Query Parameters

#### Attendance List Filters
```javascript
{
  page: number,         // Default: 1, min: 1
  limit: number,        // Default: 10, min: 1, max: 100
  startDate: string,    // Format: YYYY-MM-DD
  endDate: string,      // Format: YYYY-MM-DD
  nip: string,          // Employee NIP
  device_id: string,    // Device identifier
  jabatan: string,      // 'DOSEN' or 'KARYAWAN'
  tipe_absensi: string, // 'MASUK' or 'PULANG'
  sortBy: string,       // 'tanggal_absensi', 'waktu_absensi', 'nama'
  sortOrder: string     // 'ASC' or 'DESC'
}
```

## 🔧 Development Scripts

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

## � Testing & Development

### Health Check Endpoint
```javascript
// Check if API is running
GET /health

Response:
{
  "status": "OK",
  "timestamp": "2024-01-08T10:00:00.000Z",
  "version": "1.0.0",
  "environment": "development"
}
```

### Sample API Calls for Testing

#### 1. Login Test
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

#### 2. Get Attendance Data
```bash
curl -X GET "http://localhost:3000/api/attendance?page=1&limit=5" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### 3. Get Dashboard Stats
```bash
curl -X GET http://localhost:3000/api/dashboard/stats \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Postman Collection

Import collection berikut untuk testing:

```json
{
  "info": {
    "name": "Backend Finger API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000"
    },
    {
      "key": "accessToken",
      "value": ""
    }
  ]
}
```

## 🚀 Deployment & Production

### Environment Variables for Production
```env
# Database
DB_HOST=your_production_db_host
DB_USER=your_db_user
DB_PASSWORD=your_secure_password
DB_NAME=finger_db
DB_PORT=3306

# JWT - Use strong, random secrets
JWT_ACCESS_SECRET=your_very_long_random_access_secret_key_here
JWT_REFRESH_SECRET=your_very_long_random_refresh_secret_key_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=production

# CORS - Configure for your frontend domain
CORS_ORIGIN=https://your-frontend-domain.com

# Logging
LOG_LEVEL=info
```

### Production Checklist

- [ ] ✅ Database backup configured
- [ ] ✅ Environment variables set
- [ ] ✅ JWT secrets are strong and random
- [ ] ✅ CORS configured for frontend domain
- [ ] ✅ SSL/TLS enabled
- [ ] ✅ Rate limiting configured
- [ ] ✅ Monitoring and logging set up
- [ ] ✅ Admin password changed from default

### Docker Support

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=db
      - DB_USER=root
      - DB_PASSWORD=password
    depends_on:
      - db

  db:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=password
      - MYSQL_DATABASE=finger_db
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

## 🔧 Troubleshooting

### Common Issues

#### 1. CORS Errors
```
Error: Access to XMLHttpRequest blocked by CORS policy
```
**Solution**: Pastikan `CORS_ORIGIN` di environment variables sesuai dengan domain frontend Anda.

#### 2. Token Expired
```
Error: 401 Unauthorized
```
**Solution**: Implementasi automatic token refresh di frontend atau redirect ke login.

#### 3. Database Connection Failed
```
Error: ECONNREFUSED
```
**Solution**: Periksa database credentials dan pastikan MySQL server running.

#### 4. Rate Limit Exceeded
```
Error: 429 Too Many Requests
```
**Solution**: Implementasi retry logic dengan exponential backoff.

### Debug Mode

Enable debug logging:
```env
NODE_ENV=development
LOG_LEVEL=debug
```

### Logs Location
- Development: Console output
- Production: `./logs/app.log`

## 📈 Performance Optimization

### Database Indexing
Pastikan index berikut ada di database:
```sql
-- Attendance table indexes
CREATE INDEX idx_attendance_date ON attendance (tanggal_absensi);
CREATE INDEX idx_attendance_nip ON attendance (nip);
CREATE INDEX idx_attendance_device ON attendance (device_id);
CREATE INDEX idx_attendance_user ON attendance (user_id);

-- Admin table indexes
CREATE INDEX idx_admin_username ON admin (username);
CREATE INDEX idx_admin_email ON admin (email);
```

### Caching Strategy
- JWT tokens: Cache di memory (sudah implemented)
- Dashboard stats: Cache dengan TTL 5 menit
- Static data: Cache di CDN jika diperlukan

### Monitoring
- Response time monitoring
- Error rate tracking
- Database connection pool monitoring
- Memory usage monitoring

## �🤝 Contributing

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## � Changelog

### Version 1.0.0 (Current)
- ✅ JWT Authentication dengan Access & Refresh tokens
- ✅ CRUD operations untuk attendance management
- ✅ Dashboard analytics dan reporting
- ✅ Export functionality (Excel, PDF, CSV)
- ✅ ADMS integration untuk mesin fingerprint
- ✅ Swagger API documentation
- ✅ Rate limiting dan security headers
- ✅ Audit logging
- ✅ Admin user management

### Upcoming Features (Roadmap)
- 🔄 Real-time notifications dengan WebSocket
- 🔄 Multi-tenant support untuk multiple kampus
- 🔄 Advanced analytics dengan charts
- 🔄 Mobile app API support
- 🔄 Bulk import dari CSV/Excel
- 🔄 Automated backup system
- 🔄 API versioning
- 🔄 Advanced user roles & permissions

## 🆘 Support & Help

### Getting Help
1. **Check the documentation**: Pastikan baca README.md dan Swagger docs
2. **Search existing issues**: Cek GitHub Issues untuk masalah serupa
3. **Create new issue**: Jika belum ada, buat issue baru di GitHub

### Common Support Questions

#### Q: Bagaimana cara setup database?
A: Ikuti langkah 3 di section "Instalasi & Setup" atau jalankan `node scripts/setup_database.sql`

#### Q: Token selalu expired?
A: Periksa `JWT_ACCESS_EXPIRES_IN` di environment variables. Default 15 menit.

#### Q: CORS error di frontend?
A: Tambahkan domain frontend Anda ke `CORS_ORIGIN` environment variable.

#### Q: Bagaimana cara reset admin password?
A: Jalankan `node scripts/seed-admin.js` untuk reset ke default atau update langsung di database.

### Issue Template

Gunakan template berikut untuk report bug:

```
**Bug Description**
[Deskripsi bug]

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
[Perilaku yang diharapkan]

**Environment**
- OS: [Windows/Mac/Linux]
- Browser: [Chrome/Firefox/Safari]
- API Version: [1.0.0]

**Additional Context**
[Screenshots, logs, dll]
```

## 📞 Contact & Support

**Project Name**: Backend Finger - Sistem Rekap Absensi Kampus
**Repository**: [https://github.com/dbscoding/backend-finger](https://github.com/dbscoding/backend-finger)
**Issues**: [https://github.com/dbscoding/backend-finger/issues](https://github.com/dbscoding/backend-finger/issues)

### Developer Contact
- **Email**: [your-email@example.com]
- **LinkedIn**: [Your LinkedIn Profile]
- **Portfolio**: [Your Portfolio Website]

### Business Contact
- **Institution**: Universitas [Nama Kampus]
- **Department**: Sistem Informasi / Teknik Informatika
- **Contact Person**: [Nama Contact Person]

---

## ⚡ Quick Start for Frontend Developers

```bash
# 1. Clone backend repository
git clone https://github.com/dbscoding/backend-finger.git
cd backend-finger

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Edit .env with your configuration

# 4. Setup database
mysql -u root -p < scripts/setup_database.sql
node scripts/seed-admin.js

# 5. Start development server
npm run dev

# 6. Test API
curl http://localhost:3000/health

# 7. Access Swagger docs
open http://localhost:3000/api/docs
```

**🎉 Your backend is ready! Start building your frontend application.**

---

**Dibuat dengan ❤️ untuk kemajuan teknologi absensi kampus modern**


