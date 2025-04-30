#!/bin/bash
# Shell script to set up the APQP Manager project

# Create and activate virtual environment
echo "Creating virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Create PostgreSQL database
echo "Creating PostgreSQL database..."
echo "Please ensure PostgreSQL is running and create a database named 'apqp_manager'"
echo "You may need to update the database settings in apqp_manager/settings.py"

# Run migrations
echo "Running migrations..."
python manage.py makemigrations
python manage.py migrate

# Seed the database
echo "Seeding the database with initial data..."
python seeder.py

# Run the development server
echo "Starting development server..."
echo "Access the API testing interface at http://localhost:8000/api-testing/"
python manage.py runserver
