from core.models import History
from django.utils import timezone
from core.services.history.initialization import initialize_history

def record_team_role_assignment(person, team, role, user=None):
    """
    Record a team role assignment in the history table
    
    Args:
        person (Person): The person being assigned a role
        team (Team): The team the person is being assigned to
        role (str): The role being assigned
        user (User, optional): The user making the change
    """
    person_name = f"{person.first_name} {person.last_name}"
    event = f"User '{person_name}' assigned role '{role}' in team '{team.name}'"
    
    initialize_history(
        title=f"Team Role Assignment - {team.name}",
        event=event,
        table_name='team_member_role',
        history_id=f"{team.history_id}-{person.id}"
    )

def record_team_role_change(person, team, old_role, new_role, user=None):
    """
    Record a team role change in the history table
    
    Args:
        person (Person): The person whose role is being changed
        team (Team): The team the person belongs to
        old_role (str): The previous role
        new_role (str): The new role
        user (User, optional): The user making the change
    """
    person_name = f"{person.first_name} {person.last_name}"
    event = f"User '{person_name}' role changed from '{old_role}' to '{new_role}' in team '{team.name}'"
    
    initialize_history(
        title=f"Team Role Change - {team.name}",
        event=event,
        table_name='team_member_role',
        history_id=f"{team.history_id}-{person.id}"
    )
