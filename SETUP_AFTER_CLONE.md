# Setup After Cloning from GitHub

## Quick Setup (Automated)

### Windows:
```batch
# 1. Start Docker services
START_DOCKER_SERVICES.bat

# 2. Setup Backend
cd backend
setup.bat

# 3. Setup Frontend
cd ..\frontend
setup.bat

# 4. Start all services
cd ..
START_ALL_SERVICES.bat
```

### Linux/Mac:
```bash
# 1. Start Docker services
cd docker
docker-compose up -d

# 2. Setup Backend
cd ../backend
./setup.sh

# 3. Setup Frontend
cd ../frontend
./setup.sh

# 4. Start services manually
# Terminal 1: Django
cd backend
python manage.py runserver

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Celery Worker
cd backend
celery -A config worker --loglevel=info

# Terminal 4: Celery Beat
cd backend
celery -A config beat --loglevel=info
```

## Manual Setup

### 1. Install Dependencies

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# OR
venv\Scripts\activate    # Windows

pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Database Setup

```bash
cd backend
python manage.py migrate
python manage.py createsuperuser
```

### 3. Environment Variables

Create `.env` file in `backend/` directory:
```env
SECRET_KEY=your-secret-key-here
DEBUG=True
DATABASE_URL=postgresql://easm_user:easm_password@localhost:5432/easm_db
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

### 4. Start Services

See "Quick Setup" section above.

## What Gets Installed Automatically

- ✅ All Python packages from `requirements.txt`
- ✅ All Node.js packages from `package.json`
- ✅ Database migrations
- ✅ Virtual environments
- ✅ All dependencies

## Access URLs

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Admin Panel: http://localhost:8000/admin

## Default Credentials

After running `createsuperuser`, use those credentials to login.

