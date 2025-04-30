# PowerShell script to set up the APQP Manager project

# Create and activate virtual environment
Write-Host "Creating virtual environment..." -ForegroundColor Green
python -m venv venv
./venv/Scripts/Activate.ps1

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Green
pip install -r requirements.txt

# Create PostgreSQL database
Write-Host "Creating PostgreSQL database..." -ForegroundColor Green
Write-Host "Please ensure PostgreSQL is running and create a database named 'apqp_manager'"
Write-Host "You may need to update the database settings in apqp_manager/settings.py"

# Run migrations
Write-Host "Running migrations..." -ForegroundColor Green
python manage.py makemigrations # if doesnt work python manage.py makemigrations core
python manage.py migrate

# Seed the database
Write-Host "Seeding the database with initial data..." -ForegroundColor Green
python core/seeder/run_all.py # check the admin user in the seeder 

# Run the development server
Write-Host "Starting development server..." -ForegroundColor Green
Write-Host "Access the API testing interface at http://localhost:8000/login/"
python manage.py runserver
