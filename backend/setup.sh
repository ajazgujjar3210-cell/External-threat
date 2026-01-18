#!/bin/bash
echo "Setting up EASM Platform Backend..."
echo

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo
echo "Setup complete!"
echo
echo "Next steps:"
echo "1. Create a .env file from .env.example"
echo "2. Configure your database in .env"
echo "3. Run: python manage.py migrate"
echo "4. Run: python manage.py createsuperuser"
echo "5. Run: python manage.py runserver"
echo

