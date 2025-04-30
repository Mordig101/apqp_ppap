"""
Seeder for Team model
"""
import os
import django
import uuid

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'apqp_manager.settings')
django.setup()

from django.db import transaction
from core.models import Team

@transaction.atomic
def seed_teams():
    """Seed team data"""
    print("Seeding teams...")
    
    # Clear existing data
    Team.objects.all().delete()
    
    # Create teams
    teams = [
        {
            'name': 'Engineering Team',
            'description': 'Team responsible for engineering tasks',
            'history_id': f"{uuid.uuid4().hex}team"
        },
        {
            'name': 'Quality Team',
            'description': 'Team responsible for quality assurance',
            'history_id': f"{uuid.uuid4().hex}team"
        },
        {
            'name': 'Project Team',
            'description': 'Cross-functional project team',
            'history_id': f"{uuid.uuid4().hex}team"
        },
        {
            'name': 'Management Team',
            'description': 'Team responsible for management decisions',
            'history_id': f"{uuid.uuid4().hex}team"
        },
        {
            'name': 'Client Team',
            'description': 'Team for client representatives',
            'history_id': f"{uuid.uuid4().hex}team"
        }
    ]
    
    # Insert teams
    for team_data in teams:
        Team.objects.create(**team_data)
    
    print(f"Created {len(teams)} teams")
    return Team.objects.all()

if __name__ == "__main__":
    seed_teams()
