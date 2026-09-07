# InkMaster Pro - Professional Tattoo Studio Management

## Overview

InkMaster Pro is a modern, full-featured web application for managing tattoo studio operations. Built with PHP (backend) and vanilla JavaScript (frontend), it provides a clean, glassmorphic UI with theme customization support.

## Features

- **User Authentication**: Secure login, signup, password hashing (bcrypt), rate limiting, session management
- **Multi-user Support**: Role-based access control (admin, artist, staff)
- **Client Management**: Full CRUD for client records with avatar support, search and filter
- **Appointment Scheduling**: Visual calendar, scheduling, status tracking, service types
- **Financial Tracking**: Income/expense tracking, reports, dashboard stats
- **Inventory Management**: Stock tracking, low-stock alerts, reorder levels
- **Theme System**: 4 built-in themes (Dark, Light, Neon, Vintage) with custom color picking
- **Settings**: Profile, security (password change), notifications, business settings

## Requirements

- PHP 7.4+ with PDO MySQL extension
- MySQL 5.7+ or MariaDB 10.3+
- Web server (Apache/Nginx)
- Modern browser (Chrome/Firefox/Safari/Edge)

## Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url> inkmaster-pro
   cd inkmaster-pro
   ```

2. **Import the database schema**:
   ```bash
   mysql -u root -p < database/schema.sql
   ```

3. **Configure environment** (optional):
   Create a `.env` file in the project root:
   ```env
   DB_HOST=localhost
   DB_NAME=ink_master_pro
   DB_USER=root
   DB_PASSWORD=yourpassword
   APP_ENV=production
   ```

4. **Default credentials**:
   - Email: `admin@inkmaster.com`
   - Password: `Admin@2026`

5. **Run via built-in PHP server** (development):
   ```bash
   php -S localhost:8000 -t frontend
   ```
   Ensure the `/backend` directory is accessible from the server root.

## Project Structure

```
inkmaster-pro/
├── backend/
│   ├── config/          # Configuration files
│   │   ├── config.php
│   │   ├── database.php
│   │   └── constants.php
│   ├── api/             # API endpoints
│   │   ├── auth/        # Login, logout, signup, session
│   │   ├── clients/     # Client CRUD
│   │   ├── appointments/# Appointment scheduling
│   │   ├── financials/  # Transactions & dashboard
│   │   ├── inventory/   # Stock management
│   │   └── settings/    # Theme & profile
│   ├── core/            # Core classes
│   │   ├── Auth.php
│   │   ├── Database.php
│   │   ├── Router.php
│   │   ├── Validator.php
│   │   ├── Response.php
│   │   └── ErrorHandler.php
│   └── logs/
│       └── app.log
├── frontend/
│   ├── index.html       # Main entry point
│   ├── css/
│   │   ├── style.css
│   │   ├── loader.css
│   │   └── themes/      # Theme files
│   ├── js/
│   │   ├── api.js       # API client
│   │   ├── auth.js      # Auth manager
│   │   ├── app.js       # Main app controller
│   │   └── components/  # Feature modules
│   └── assets/
│       ├── images/
│       └── icons/
├── database/
│   └── schema.sql
└── README.md
```

## API Endpoints

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login.php` | POST | Login with email & password |
| `/api/auth/logout.php` | POST | Logout and destroy session |
| `/api/auth/signup.php` | POST | Register new user |
| `/api/auth/session.php` | GET | Check current session |

### Settings
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/settings/theme.php` | GET/POST | Get/update theme preferences |
| `/api/settings/profile.php` | GET/PUT | Get/update profile & password |

### Clients
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/clients/index.php` | GET | List all clients |
| `/api/clients/index.php` | POST | Create new client |
| `/api/clients/read_update.php?id=X` | GET | Get specific client |
| `/api/clients/read_update.php?id=X` | PUT | Update client |
| `/api/clients/read_update.php?id=X` | DELETE | Delete client |

### Appointments
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/appointments/index.php` | GET | List appointments |
| `/api/appointments/create.php` | POST | Create appointment |
| `/api/appointments/update.php?id=X` | GET/PUT/DELETE | Get/update/cancel appointment |

### Financials
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/financials/transactions.php` | GET | List transactions |
| `/api/financials/transactions.php` | POST | Create transaction |
| `/api/financials/transaction_detail.php?id=X` | GET/PUT/DELETE | Manage specific transaction |
| `/api/financials/dashboard.php` | GET | Get dashboard statistics |

### Inventory
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/inventory/index.php` | GET | List inventory items |
| `/api/inventory/alerts.php` | GET | Low stock alerts |
| `/api/inventory/create.php` | POST | Create inventory item |
| `/api/inventory/update.php?id=X` | GET/PUT/DELETE | Manage specific item |

## Development

To start development:

1. Set up the project as described in Setup
2. Open `frontend/index.html` in your browser
3. For backend testing, make sure PHP with PDO MySQL is running

## Security

- Password hashing with bcrypt (cost 12)
- Session regeneration on login
- IP address session validation
- Rate limiting (5 attempts / 15 min lockout)
- CSRF protection via session tokens
- Input validation & sanitization
- Secure session settings (httponly, samesite, secure flags)

## License

Proprietary. All rights reserved.
