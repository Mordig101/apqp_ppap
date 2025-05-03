"""
Seeder for Project model
"""
import os
import django
import uuid
from faker import Faker

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'apqp_manager.settings')
django.setup()

from django.db import transaction
from core.models import Project, Client, Team

fake = Faker()

@transaction.atomic
def seed_projects():
    """Seed project data"""
    print("Seeding projects...")
    
    # Clear existing data
    Project.objects.all().delete()
    
    # Get clients and teams
    clients = Client.objects.all()
    teams = Team.objects.exclude(name='Client Team')
    
    if not clients or not teams:
        print("Error: Clients and Teams must be seeded first")
        return
    
    # Create projects
    projects = []
    
    # Create 5 projects with different statuses
    statuses = ['Planning', 'In Progress', 'On Hold', 'Completed', 'Archived']
    
    for i, status in enumerate(statuses):
        history_id = f"{uuid.uuid4().hex}project"
        
        project_data = {
            'name': fake.catch_phrase(),
            'description': fake.paragraph(),
            'client': fake.random_element(clients),
            'team': fake.random_element(teams),
            'status': status,
            'history_id': history_id
        }
        
        projects.append(project_data)
    
    # Insert projects
    created_projects = []
    for project_data in projects:
        created_projects.append(Project.objects.create(**project_data))
    
    print(f"Created {len(created_projects)} projects")
    return created_projects

if __name__ == "__main__":
    seed_projects()
