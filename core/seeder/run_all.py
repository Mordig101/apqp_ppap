#!/usr/bin/env python
"""
Run all seeders in the correct order to populate the database
"""
import os
import sys
import django
import importlib
from django.db import transaction

# Add the project root directory to the Python path
# This line is crucial - it tells Python where to find your Django project
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'apqp_manager.settings')
django.setup()

# Import all seeders
from authorization_seeder import seed_authorizations
from permission_seeder import seed_permissions
from department_seeder import seed_departments
from team_seeder import seed_teams
from person_seeder import seed_persons
from contact_seeder import seed_contacts
from user_seeder import seed_users
from client_seeder import seed_clients
from phase_template_seeder import seed_phase_templates
from ppap_element_seeder import seed_ppap_elements
from output_template_seeder import seed_output_templates
from project_seeder import seed_projects
from ppap_seeder import seed_ppaps
from phase_seeder import seed_phases
from output_seeder import seed_outputs
from document_seeder import seed_documents
from todo_seeder import seed_todos
from history_seeder import seed_histories
from fastquery_seeder import seed_fastqueries

@transaction.atomic
def run_all_seeders():
    """Run all seeders in the correct order"""
    print("Starting database seeding...")
    
    # First, seed the basic models
    seed_authorizations()
    seed_permissions()
    seed_departments()
    seed_teams()
    
    # Then seed people and contacts
    seed_persons()
    seed_contacts()
    seed_users()
    seed_clients()
    
    # Seed templates
    seed_phase_templates()
    seed_ppap_elements()
    seed_output_templates()
    
    # Seed project hierarchy
    seed_projects()
    seed_ppaps()
    seed_phases()
    seed_outputs()
    seed_documents()
    
    # Seed relationships and metadata
    seed_todos()
    seed_histories()
    seed_fastqueries()
    
    print("Database seeding completed successfully!")

if __name__ == "__main__":
    run_all_seeders()
