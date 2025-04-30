from core.models import History
from django.utils import timezone
from core.services.history.initialization import initialize_history

def record_team_role_assignment(team, person_id, role, user=None):
    """
    Record a team role assignment in the history table
    
    Args:
        team (Team): The team the person is being assigned to
        person_id (int): The ID of the person being assigned a role
        role (str): The role being assigned
        user (User, optional): The user making the change
    """
    event = f"Person (ID: {person_id}) assigned role '{role}' in team '{team.name}'"
    
    initialize_history(
        title=f"Team Role Assignment - {team.name}",
        event=event,
        table_name='team_member_role',
        history_id=team.history_id
    )

def record_team_role_change(team, person_id, new_role, user=None):
    """
    Record a team role change in the history table
    
    Args:
        team (Team): The team the person belongs to
        person_id (int): The ID of the person whose role is being changed
        new_role (str): The new role being assigned
        user (User, optional): The user making the change
    """
    event = f"Person (ID: {person_id}) role changed to '{new_role}' in team '{team.name}'"
    
    initialize_history(
        title=f"Team Role Change - {team.name}",
        event=event,
        table_name='team_member_role',
        history_id=team.history_id
    )

def record_team_role_removal(team, person_id, role, user=None):
    """
    Record a team role removal in the history table
    
    Args:
        team (Team): The team the person is being removed from
        person_id (int): The ID of the person being removed
        role (str): The role being removed
        user (User, optional): The user making the change
    """
    event = f"Person (ID: {person_id}) with role '{role}' removed from team '{team.name}'"
    
    initialize_history(
        title=f"Team Role Removal - {team.name}",
        event=event,
        table_name='team_member_role',
        history_id=team.history_id
    )
