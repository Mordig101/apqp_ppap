"""
Seeder for Team model
"""
import os
import django
import uuid
import logging

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'apqp_manager.settings')
django.setup()

from django.db import transaction
from core.models import Team, Person, History
from .history_seeder import create_history_record

logger = logging.getLogger(__name__)

@transaction.atomic
def seed_teams(count=5):
    """
    Seed teams with members.
    
    Args:
        count: Number of teams to create
    
    Returns:
        list: Created teams
    """
    logger.info(f"Seeding {count} teams...")
    
    teams = []
    
    # Create some user teams
    for i in range(count // 2):
        name = f"Development Team {i+1}"
        description = f"User team for internal development projects {i+1}"
        
        # Create team
        team = Team.objects.create(
            name=name,
            description=description,
            is_user_team=True  # Mark as user team
        )
        
        # Create history record for the team
        history = create_history_record(
            title=f"Team: {name}",
            table_name="team",
            details=f"Created team {name}"
        )
        
        # Update history ID
        team.history_id = history.id
        team.save(update_fields=['history_id'])
        
        # Add team members who are users
        user_persons = Person.objects.filter(is_user=True).order_by('?')[:3]
        for person in user_persons:
            team.members.add(person)
        
        teams.append(team)
    
    # Create some client teams
    for i in range(count - count // 2):
        name = f"Client Project Team {i+1}"
        description = f"External team for client projects {i+1}"
        
        # Create team
        team = Team.objects.create(
            name=name,
            description=description,
            is_user_team=False  # Mark as client team
        )
        
        # Create history record for the team
        history = create_history_record(
            title=f"Team: {name}",
            table_name="team",
            details=f"Created team {name}"
        )
        
        # Update history ID
        team.history_id = history.id
        team.save(update_fields=['history_id'])
        
        # Add external team members (non-users)
        non_user_persons = Person.objects.filter(is_user=False).order_by('?')[:4]
        for person in non_user_persons:
            team.members.add(person)
        
        teams.append(team)
    
    # Verify is_user_team flag matches team composition
    for team in Team.objects.all():
        has_users = team.has_users
        if team.is_user_team != has_users:
            logger.warning(f"Fixed team {team.name}: is_user_team={has_users}")
            team.is_user_team = has_users
            team.save(update_fields=['is_user_team'])
    
    logger.info(f"Created {len(teams)} teams")
    return teams

def run():
    """Run the seeder"""
    return seed_teams()

if __name__ == "__main__":
    run()
