# APQP/PPAP Manager

## Overview
The Advanced Product Quality Planning (APQP) and Production Part Approval Process (PPAP) Manager is a comprehensive web application designed to streamline and manage quality planning processes in manufacturing environments. This system helps track project progress, manage documentation, and ensure compliance with quality standards throughout the product lifecycle.

## Features
- **Project Management**: Create and track projects with clients and team assignments
- **PPAP Tracking**: Manage PPAP levels, elements, and approvals
- **Phase Management**: Track project phases with templated outputs
- **Document Control**: Upload, version, and manage required documentation
- **User Management**: Role-based access control with customizable permissions
- **History Tracking**: Complete audit trail for all system activities
- **Task Assignment**: Todo system for assigning and tracking output responsibilities
- **Interactive API**: Testing interface for all system endpoints

## Technology Stack
- **Backend**: Django (Python)
- **Database**: PostgreSQL
- **Frontend**: HTML, CSS, JavaScript, Bootstrap 5
- **Authentication**: Django Authentication System
- **API**: Django REST Framework

## Requirements
- Python 3.8 or higher
- PostgreSQL database
- Web browser (Chrome, Firefox, Edge recommended)

## Project Structure
The application follows a modular architecture with:
- Core models organized by entity type (Project, PPAP, Phase, Output, etc.)
- Service-oriented approach for business logic
- History tracking for all entities
- Template-based system for phases and outputs

## Setup Instructions

### Using PowerShell (Windows)
1. Clone the repository to your local machine
2. Navigate to the project directory
3. Run the setup script:
   ```
   .\setup.ps1
   ```
   This will:
   - Create and activate a virtual environment
   - Install dependencies
   - Set up the database
   - Run migrations
   - Seed the database with initial data
   - Start the development server

### Using Bash (Linux/Mac)
1. Clone the repository to your local machine
2. Navigate to the project directory
3. Run the setup script:
   ```
   bash setup.sh
   ```

### Manual Setup
1. Create a virtual environment:
   ```
   python -m venv venv
   ```

2. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Create PostgreSQL database named 'apqp_manager'

5. Run migrations:
   ```
   python manage.py makemigrations (if doesnt work run : python manage.py makemigrations core)
   python manage.py migrate
   ```

6. Seed the database:
   ```
   python core/seeder/run_all.py
   ```

7. Run the development server:
   ```
   python manage.py runserver
   ```

## Accessing the Application
1. Open your web browser and navigate to: `http://localhost:8000/login/`
2. Use the default credentials:
   - Username: `admin`
   - Password: `admin123`

## API Testing Interface
The system includes a built-in API testing interface accessible at:
`http://localhost:8000/login/`

This interface allows you to test various endpoints including:
- Projects, PPAPs, Phases, Outputs
- Documents, Users
- Timeline management
- Permission assignments

## Contributing
Please follow the project structure and code style when contributing.
All changes should include appropriate history tracking.

## License
This software is proprietary and confidential.
Unauthorized copying or distribution is prohibited.
