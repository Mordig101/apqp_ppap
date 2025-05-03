#!/usr/bin/env python
"""
Run all seeders in the correct order to populate the database
"""
import os
import django
import sys
import importlib
from django.db import transaction

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'apqp_manager.settings')
django.setup()

# Import all seeders
from seeder.authorization_seeder import seed_authorizations
from seeder.permission_seeder import seed_permissions
from seeder.department_seeder import seed_departments
from seeder.team_seeder import seed_teams
from seeder.person_seeder import seed_persons
from seeder.contact_seeder import seed_contacts
from seeder.user_seeder import seed_users
from seeder.client_seeder import seed_clients
from seeder.phase_template_seeder import seed_phase_templates
from seeder.ppap_element_seeder import seed_ppap_elements
from seeder.output_template_seeder import seed_output_templates
from seeder.project_seeder import seed_projects
from seeder.ppap_seeder import seed_ppaps
from seeder.phase_seeder import seed_phases
from seeder.output_seeder import seed_outputs
from seeder.document_seeder import seed_documents
from seeder.todo_seeder import seed_todos
from seeder.history_seeder import seed_histories
from seeder.fastquery_seeder import seed_fastqueries

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
