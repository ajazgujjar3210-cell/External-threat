# EASM Platform - External Asset Surface Management

A comprehensive platform for managing and monitoring external-facing assets, vulnerabilities, and security risks.

## Features

- 🔍 **Asset Discovery**: Automated and manual discovery of internet-facing assets
- 🛡️ **Security Scanning**: Port scanning, SSL checks, and vulnerability detection
- 📊 **Risk Management**: Risk scoring and prioritization
- 📈 **Reporting**: Comprehensive security reports
- 🔔 **Notifications**: Real-time alerts for asset changes
- 🌓 **Dark Mode**: Light and dark theme support
- 👥 **Multi-tenant**: Organization-based access control
- 🔐 **MFA Support**: Multi-factor authentication

## Tech Stack

### Backend
- Django 4.x
- Django REST Framework
- PostgreSQL
- Redis
- Celery (Background tasks)
- Celery Beat (Scheduled tasks)

### Frontend
- React.js
- Vite
- Tailwind CSS
- Axios

## Quick Start

### Prerequisites
- Python 3.9+
- Node.js 16+
- Docker Desktop (for PostgreSQL and Redis)
- Git

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   cd External-assest
   ```

2. **Start Docker services:**
   ```bash
   START_DOCKER_SERVICES.bat
   ```

3. **Setup Backend:**
   ```bash
   cd backend
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py createsuperuser
   ```

4. **Setup Frontend:**
   ```bash
   cd frontend
   npm install
   ```

5. **Start all services:**
   ```bash
   START_ALL_SERVICES.bat
   ```

### Access URLs
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Admin Panel: http://localhost:8000/admin

### Default Credentials
- Email: `admin@easm.local`
- Password: `Admin@123`

## Project Structure

```
.
├── backend/          # Django backend
│   ├── accounts/     # User authentication
│   ├── assets/       # Asset management
│   ├── scans/        # Scanning functionality
│   ├── vulnerabilities/  # Vulnerability tracking
│   └── risk_engine/  # Risk calculation
├── frontend/         # React frontend
│   └── src/
│       ├── components/
│       ├── pages/
│       └── contexts/
├── docker/           # Docker configuration
└── tools/            # External tools (subfinder, naabu)
```

## Development

### Running Services

- **Django Server**: `cd backend && python manage.py runserver`
- **Frontend Dev Server**: `cd frontend && npm run dev`
- **Celery Worker**: `cd backend && celery -A config worker --loglevel=info --pool=solo`
- **Celery Beat**: `cd backend && celery -A config beat --loglevel=info`

### Database Migrations

```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software.

## Support

For issues and questions, please open an issue on GitHub.
