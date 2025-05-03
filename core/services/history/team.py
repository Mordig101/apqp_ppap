from core.models import Team
from django.utils import timezone
from core.services.history.initialization import (
    get_history, initialize_history, add_history_event, ensure_history_id
)

def record_team_creation(team):
    """
    Record team creation in history
    
    Args:
        team: Team object
        
    Returns:
        History: Created history record
    """
    # Ensure team has a history_id
    ensure_history_id(team)
    
    # Initialize a new history record
    history = initialize_history(
        title=team.name,
        event_type="create",
        event_details=f"Team created with ID {team.id}",
        table_name='team',
        history_id=team.history_id
    )
    
    return history

def record_team_update(team, updated_fields):
    """
    Record team update in history
    
    Args:
        team: Team object
        updated_fields: List of updated field names
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(team)
    
    if not history:
        return None
    
    # Make sure title stays updated
    history.title = team.name
    history.save(update_fields=['title'])
    
    # Add update event
    event_details = f"Team updated. Fields changed: {', '.join(updated_fields)}"
    
    return add_history_event(history, "update", event_details)

def record_team_name_change(team, old_name, new_name):
    """
    Record team name change in history
    
    Args:
        team: Team object
        old_name: Previous team name
        new_name: New team name
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(team)
    
    if not history:
        return None
    
    # Update the title to reflect the new name
    history.title = new_name
    history.save(update_fields=['title'])
    
    # Add name change event
    event_details = f"Team name changed from '{old_name}' to '{new_name}'"
    
    return add_history_event(history, "name_change", event_details)

def record_team_member_addition(team, person_id):
    """
    Record team member addition in history
    
    Args:
        team: Team object
        person_id: ID of person added to team
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(team)
    
    if not history:
        return None
    
    # Add member addition event
    event_details = f"Person with ID {person_id} added to team"
    
    return add_history_event(history, "member_add", event_details)

def record_team_member_removal(team, person_id):
    """
    Record team member removal in history
    
    Args:
        team: Team object
        person_id: ID of person removed from team
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(team)
    
    if not history:
        return None
    
    # Add member removal event
    event_details = f"Person with ID {person_id} removed from team"
    
    return add_history_event(history, "member_remove", event_details)

def record_team_lead_change(team, old_lead_id, new_lead_id):
    """
    Record team lead change in history
    
    Args:
        team: Team object
        old_lead_id: ID of previous team lead (can be None)
        new_lead_id: ID of new team lead (can be None)
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(team)
    
    if not history:
        return None
    
    # Determine event details based on the change
    if old_lead_id is None and new_lead_id is not None:
        event_details = f"Team lead assigned: Person {new_lead_id}"
        event_type = "lead_assign"
    elif old_lead_id is not None and new_lead_id is None:
        event_details = f"Team lead removed: Person {old_lead_id}"
        event_type = "lead_remove"
    else:
        event_details = f"Team lead changed from Person {old_lead_id} to Person {new_lead_id}"
        event_type = "lead_change"
    
    return add_history_event(history, event_type, event_details)

def record_team_department_assignment(team, department_id):
    """
    Record team assignment to department in history
    
    Args:
        team: Team object
        department_id: Department ID
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(team)
    
    if not history:
        return None
    
    # Add department assignment event
    event_details = f"Team assigned to Department {department_id}"
    
    return add_history_event(history, "department_assign", event_details)

def record_team_department_removal(team, department_id):
    """
    Record team removal from department in history
    
    Args:
        team: Team object
        department_id: Department ID
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(team)
    
    if not history:
        return None
    
    # Add department removal event
    event_details = f"Team removed from Department {department_id}"
    
    return add_history_event(history, "department_remove", event_details)

def record_team_deletion(team):
    """
    Record team deletion in history
    
    Args:
        team: Team object
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(team)
    
    if not history:
        return None
    
    # Add deletion event
    event_details = f"Team deleted with ID {team.id}"
    
    return add_history_event(history, "delete", event_details)

def get_team_history(team_id):
    """
    Get history record for a team
    
    Args:
        team_id (int): Team ID
    
    Returns:
        History or None: Team history record if found, None otherwise
    """
    try:
        team = Team.objects.get(id=team_id)
        return get_history(team)
    except Team.DoesNotExist:
        return None
