@echo off
echo Setting up EASM Platform Backend...
echo.

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing dependencies...
pip install --upgrade pip
pip install -r requirements.txt

echo.
echo Running database migrations...
python manage.py migrate

echo.
echo Setup complete!
echo.
echo Next steps:
echo 1. Create a .env file with your configuration
echo 2. Run: python manage.py createsuperuser (to create admin user)
echo 3. Run: python manage.py runserver (to start Django server)
echo.
echo Note: Make sure Docker services (PostgreSQL and Redis) are running!
echo Run: START_DOCKER_SERVICES.bat from project root
echo.

pause

