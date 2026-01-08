# Database Setup Instructions

## 1. Install MySQL Server
Download and install MySQL Server from https://dev.mysql.com/downloads/mysql/

## 2. Start MySQL Service
Make sure MySQL service is running:
```powershell
# Check MySQL service status
Get-Service -Name "*mysql*" | Select-Object Name, Status

# Start MySQL service if not running
Start-Service -Name "MySQL80"  # Adjust service name as needed
```

## 3. Setup Database and User
Open MySQL command line or MySQL Workbench and run the setup script:

### Option A: Using MySQL Command Line (if available)
```bash
mysql -u root -p < scripts/setup_database.sql
```

### Option B: Using MySQL Workbench
1. Open MySQL Workbench
2. Connect to your MySQL server as root
3. Open and run `scripts/setup_database.sql`

### Option C: Manual Setup
If you can't access MySQL command line, run these commands manually:

```sql
-- Create database
CREATE DATABASE IF NOT EXISTS finger_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user
CREATE USER IF NOT EXISTS 'finger_user'@'localhost' IDENTIFIED BY 'finger';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, INDEX ON finger_db.* TO 'finger_user'@'localhost';
GRANT EXECUTE ON finger_db.* TO 'finger_user'@'localhost';

-- Flush privileges
FLUSH PRIVILEGES;
```

## 4. Run Database Schema
After creating database and user, run the schema:

```sql
-- In MySQL command line
USE finger_db;
SOURCE scripts/finger_db_schema.sql;
```

Or using MySQL Workbench, open and run `scripts/finger_db_schema.sql`

## 5. Verify Setup
Test the connection:
```bash
# Test database connection
mysql -u finger_user -p finger_db -e "SELECT 1 as test;"
```

## 6. Update Environment Variables (if needed)
Make sure your `.env` file has correct credentials:
```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=finger_db
DB_USER=finger_user
DB_PASSWORD=finger
```

## 7. Test Application
```bash
npm run dev
```

The server should start successfully on port 3000.

The server should start successfully on port 3000.