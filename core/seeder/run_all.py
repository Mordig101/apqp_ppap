#!/usr/bin/env python
"""
Run all seeders in the correct order to populate the database
"""
import os
import django
import sys
import time
from django.db import transaction, connection

# Add the project root directory to Python's path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

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

def clean_database():
    """
    Clean all tables in the database while respecting foreign key constraints
    """
    print("Cleaning database...")
    
    # Import models after Django setup
    from django.apps import apps
    
    from core.models import (
        Todo, Document, Output, Phase, PPAP, Project, 
        Person, User, Team, Department, Authorization, Permission,
        Client, Contact, History, FastQuery
    )
    
    # Get cursor for raw SQL
    cursor = connection.cursor()
    
    # Disable foreign key checks (adapts based on database type)
    if connection.vendor == 'postgresql':
        cursor.execute("SET session_replication_role = 'replica';")
    elif connection.vendor == 'mysql':
        cursor.execute("SET FOREIGN_KEY_CHECKS=0;")
    elif connection.vendor == 'sqlite':
        cursor.execute("PRAGMA foreign_keys = OFF;")
    
    try:
        # Delete all records in reverse order of dependencies
        print("Deleting todos...")
        Todo.objects.all().delete()
        
        print("Deleting documents...")
        Document.objects.all().delete()
        
        print("Deleting outputs...")
        Output.objects.all().delete()
        
        print("Deleting phases...")
        Phase.objects.all().delete()
        
        print("Deleting PPAPs...")
        PPAP.objects.all().delete()
        
        print("Deleting projects...")
        Project.objects.all().delete()
        
        print("Deleting clients...")
        Client.objects.all().delete()
        
        print("Deleting users...")
        User.objects.all().delete()
        
        print("Deleting persons...")
        Person.objects.all().delete()
        
        print("Deleting contacts...")
        Contact.objects.all().delete()
        
        print("Deleting teams...")
        Team.objects.all().delete()
        
        print("Deleting departments...")
        Department.objects.all().delete()
        
        print("Deleting permissions...")
        Permission.objects.all().delete()
        
        print("Deleting authorizations...")
        Authorization.objects.all().delete()
        
        print("Deleting histories...")
        History.objects.all().delete()
        
        print("Deleting fast queries...")
        FastQuery.objects.all().delete()
        
        # Clean any other models from the apps
        for app_config in apps.get_app_configs():
            if app_config.name.startswith('core'):
                for model in app_config.get_models():
                    if model not in [Todo, Document, Output, Phase, PPAP, Project, 
                                     Person, User, Team, Department, Authorization,
                                     Permission, Client, Contact, History, FastQuery]:
                        print(f"Deleting {model.__name__}...")
                        model.objects.all().delete()
        
    finally:
        # Re-enable foreign key checks
        if connection.vendor == 'postgresql':
            cursor.execute("SET session_replication_role = 'origin';")
        elif connection.vendor == 'mysql':
            cursor.execute("SET FOREIGN_KEY_CHECKS=1;")
        elif connection.vendor == 'sqlite':
            cursor.execute("PRAGMA foreign_keys = ON;")
    
    print("Database cleaned successfully!")

@transaction.atomic
def run_all_seeders():
    """Run all seeders in the correct order"""
    start_time = time.time()
    print("\n========================================")
    print("Starting database seeding process...")
    print("========================================\n")
    
    # First, clean the database
    print("\n--- CLEANING DATABASE ---")
    clean_database()
    
    # First, seed the basic models
    print("\n--- SEEDING BASIC MODELS ---")
    seed_authorizations()
    seed_permissions()
    seed_departments()
    seed_teams()
    
    # Then seed people and contacts
    print("\n--- SEEDING PEOPLE AND CONTACTS ---")
    seed_persons()
    seed_contacts()
    seed_users()
    seed_clients()
    
    # Seed templates
    print("\n--- SEEDING TEMPLATES ---")
    seed_phase_templates()
    seed_ppap_elements()
    seed_output_templates()
    
    # Seed project hierarchy
    print("\n--- SEEDING PROJECT HIERARCHY ---")
    seed_projects()
    seed_ppaps()
    seed_phases()
    seed_outputs()
    seed_documents()
    
    # Seed relationships and metadata
    print("\n--- SEEDING RELATIONSHIPS AND METADATA ---")
    seed_todos()
    seed_histories()
    seed_fastqueries()
    
    duration = time.time() - start_time
    print("\n========================================")
    print(f"Database seeding completed in {duration:.2f} seconds!")
    print("========================================\n")

if __name__ == "__main__":
    # Check for command line arguments
    if len(sys.argv) > 1 and sys.argv[1] == "--clean-only":
        clean_database()
    else:
        run_all_seeders()
