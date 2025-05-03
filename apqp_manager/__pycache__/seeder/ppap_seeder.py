"""
Seeder for PPAP model
"""
import os
import django
import uuid
from faker import Faker

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'apqp_manager.settings')
django.setup()

from django.db import transaction
from core.models import PPAP, Project

fake = Faker()

@transaction.atomic
def seed_ppaps():
    """Seed PPAP data"""
    print("Seeding PPAPs...")
    
    # Clear existing data
    PPAP.objects.all().delete()
    
    # Get projects
    projects = Project.objects.all()
    
    if not projects:
        print("Error: Projects must be seeded first")
        return
    
    # Create PPAPs for each project
    ppaps = []
    
    for project in projects:
        # Map project status to PPAP status
        status_map = {
            'Planning': 'Not Started',
            'In Progress': 'In Progress',
            'On Hold': 'On Hold',
            'Completed': 'Completed',
            'Archived': 'Approved'
        }
        
        ppap_status = status_map.get(project.status, 'Not Started')
        
        # Generate a random PPAP level (1-5)
        ppap_level = fake.random_int(min=1, max=5)
        
        history_id = f"{uuid.uuid4().hex}ppap"
        
        ppap_data = {
            'project': project,
            'level': ppap_level,
            'status': ppap_status,
            'review': fake.paragraph() if ppap_status in ['Completed', 'Approved'] else None,
            'history_id': history_id
        }
        
        ppap = PPAP.objects.create(**ppap_data)
        
        # Update project with PPAP reference
        project.ppap = ppap
        project.save()
        
        ppaps.append(ppap)
    
    print(f"Created {len(ppaps)} PPAPs")
    return ppaps

if __name__ == "__main__":
    seed_ppaps()
