from core.models import Department
from django.utils import timezone
from core.services.history.initialization import (
    get_history, initialize_history, add_history_event, ensure_history_id
)

def record_department_creation(department):
    """
    Record department creation in history
    
    Args:
        department (Department): Created department
        
    Returns:
        History: Created history record
    """
    # Ensure department has a history_id
    ensure_history_id(department)
    
    # Initialize a new history record
    history = initialize_history(
        title=f"Department {department.name}",
        event_type="create",
        event_details=f"Department created with ID {department.id}",
        table_name='department',
        history_id=department.history_id
    )
    
    return history

def record_department_update(department, updated_fields=None):
    """
    Record department update in history
    
    Args:
        department (Department): Updated department
        updated_fields (list, optional): List of updated fields
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(department)
    
    if not history:
        return None
    
    # Add update event
    if updated_fields:
        event_details = f"Department updated. Fields changed: {', '.join(updated_fields)}"
    else:
        event_details = "Department updated."
    
    # Make sure title stays updated with current name
    history.title = f"Department {department.name}"
    history.save(update_fields=['title'])
    
    return add_history_event(history, "update", event_details)

def record_department_name_change(department, old_name, new_name):
    """
    Record department name change in history
    
    Args:
        department (Department): Department object
        old_name (str): Previous department name
        new_name (str): New department name
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(department)
    
    if not history:
        return None
    
    # Update the title to reflect the new name
    history.title = f"Department {new_name}"
    history.save(update_fields=['title'])
    
    # Add name change event
    event_details = f"Department name changed from '{old_name}' to '{new_name}'"
    
    return add_history_event(history, "name_change", event_details)

def record_department_responsible_change(department, old_responsible_id, new_responsible_id):
    """
    Record department responsible person change in history
    
    Args:
        department (Department): Department object
        old_responsible_id: ID of previous responsible person (can be None)
        new_responsible_id: ID of new responsible person (can be None)
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(department)
    
    if not history:
        return None
    
    # Create event details
    if old_responsible_id is None and new_responsible_id is not None:
        event_details = f"Responsible person assigned to department (ID: {new_responsible_id})"
        event_type = "responsible_assign"
    elif old_responsible_id is not None and new_responsible_id is None:
        event_details = f"Responsible person removed from department (was ID {old_responsible_id})"
        event_type = "responsible_remove"
    else:
        event_details = f"Department responsible changed from ID {old_responsible_id} to ID {new_responsible_id}"
        event_type = "responsible_change"
    
    return add_history_event(history, event_type, event_details)

def record_department_team_assignment(department, team):
    """
    Record department team assignment in history
    
    Args:
        department (Department): Department object
        team (Team): Team being assigned to department
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(department)
    
    if not history:
        return None
    
    # Add team assignment event
    event_details = f"Team '{team.name}' (ID: {team.id}) assigned to department"
    
    return add_history_event(history, "team_assign", event_details)

def record_department_team_removal(department, team):
    """
    Record department team removal in history
    
    Args:
        department (Department): Department object
        team (Team): Team being removed from department
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(department)
    
    if not history:
        return None
    
    # Add team removal event
    event_details = f"Team '{team.name}' (ID: {team.id}) removed from department"
    
    return add_history_event(history, "team_remove", event_details)

def record_department_deletion(department):
    """
    Record department deletion in history
    
    Args:
        department (Department): Deleted department
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(department)
    
    if not history:
        return None
    
    # Add deletion event
    event_details = f"Department with ID {department.id} deleted"
    
    return add_history_event(history, "delete", event_details)

def get_department_history(department_id):
    """
    Get history record for a department
    
    Args:
        department_id: Department ID
        
    Returns:
        History or None: Department history record if found, None otherwise
    """
    try:
        department = Department.objects.get(id=department_id)
        return get_history(department)
    except Department.DoesNotExist:
        return None
