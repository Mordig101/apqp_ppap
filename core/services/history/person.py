from core.models import Person
from django.utils import timezone
from core.services.history.initialization import (
    get_history, initialize_history, add_history_event, ensure_history_id
)

def record_person_creation(person):
    """
    Record person creation in history
    
    Args:
        person: Person object
        
    Returns:
        History: Created history record
    """
    # Ensure person has a history_id
    ensure_history_id(person)
    
    # Initialize a new history record
    history = initialize_history(
        title=f"{person.first_name} {person.last_name}",
        event_type="create",
        event_details=f"Person created with ID {person.id}",
        table_name='person',
        history_id=person.history_id
    )
    
    return history

def record_person_update(person, updated_fields):
    """
    Record person update in history
    
    Args:
        person: Person object
        updated_fields: List of updated field names
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(person)
    
    if not history:
        return None
    
    # Make sure title stays updated with current name
    history.title = f"{person.first_name} {person.last_name}"
    history.save(update_fields=['title'])
    
    # Add update event
    event_details = f"Person updated. Fields changed: {', '.join(updated_fields)}"
    
    return add_history_event(history, "update", event_details)

def record_person_name_change(person, old_first_name, old_last_name, new_first_name, new_last_name):
    """
    Record person name change in history
    
    Args:
        person: Person object
        old_first_name: Previous first name
        old_last_name: Previous last name
        new_first_name: New first name
        new_last_name: New last name
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(person)
    
    if not history:
        return None
    
    # Update the title to reflect the new name
    history.title = f"{new_first_name} {new_last_name}"
    history.save(update_fields=['title'])
    
    # Add name change event
    old_full_name = f"{old_first_name} {old_last_name}"
    new_full_name = f"{new_first_name} {new_last_name}"
    event_details = f"Person name changed from '{old_full_name}' to '{new_full_name}'"
    
    return add_history_event(history, "name_change", event_details)

def record_person_team_change(person, old_team_id, new_team_id):
    """
    Record person team change in history
    
    Args:
        person: Person object
        old_team_id: ID of previous team (None if added to team)
        new_team_id: ID of new team (None if removed from team)
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(person)
    
    if not history:
        return None
    
    # Determine event type and details based on the change
    if old_team_id is None and new_team_id is not None:
        event_type = "team_assignment"
        event_details = f"Person added to team with ID {new_team_id}"
    elif old_team_id is not None and new_team_id is None:
        event_type = "team_removal"
        event_details = f"Person removed from team with ID {old_team_id}"
    else:
        event_type = "team_transfer"
        event_details = f"Person moved from team with ID {old_team_id} to team with ID {new_team_id}"
    
    return add_history_event(history, event_type, event_details)

def record_person_department_change(person, old_department_id, new_department_id):
    """
    Record person department change in history
    
    Args:
        person: Person object
        old_department_id: ID of previous department (None if first assignment)
        new_department_id: ID of new department (None if removed from department)
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(person)
    
    if not history:
        return None
    
    # Determine event type and details based on the change
    if old_department_id is None and new_department_id is not None:
        event_type = "department_assignment"
        event_details = f"Person assigned to department with ID {new_department_id}"
    elif old_department_id is not None and new_department_id is None:
        event_type = "department_removal"
        event_details = f"Person removed from department with ID {old_department_id}"
    else:
        event_type = "department_transfer"
        event_details = f"Person moved from department with ID {old_department_id} to department with ID {new_department_id}"
    
    return add_history_event(history, event_type, event_details)

def record_person_role_change(person, old_role, new_role):
    """
    Record person role change in history
    
    Args:
        person: Person object
        old_role: Previous role
        new_role: New role
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(person)
    
    if not history:
        return None
    
    # Add role change event
    event_details = f"Person role changed from '{old_role}' to '{new_role}'"
    
    return add_history_event(history, "role_change", event_details)

def record_person_contact_info_change(person, field_name, old_value, new_value):
    """
    Record person contact information change in history
    
    Args:
        person: Person object
        field_name: Name of the contact field (email, phone, etc.)
        old_value: Previous value
        new_value: New value
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(person)
    
    if not history:
        return None
    
    # Add contact info change event
    event_details = f"Person {field_name} changed from '{old_value}' to '{new_value}'"
    
    return add_history_event(history, f"{field_name}_change", event_details)

def record_person_status_change(person, old_status, new_status):
    """
    Record person status change in history
    
    Args:
        person: Person object
        old_status: Previous status
        new_status: New status
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(person)
    
    if not history:
        return None
    
    # Add status change event
    event_details = f"Person status changed from '{old_status}' to '{new_status}'"
    
    # Determine event type based on status
    event_type = "status_change"
    if new_status.lower() in ['active']:
        event_type = "activate"
    elif new_status.lower() in ['inactive', 'on_leave']:
        event_type = "deactivate"
    elif new_status.lower() in ['retired', 'terminated']:
        event_type = "terminate"
    
    return add_history_event(history, event_type, event_details)

def record_person_deletion(person):
    """
    Record person deletion in history
    
    Args:
        person: Person object
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(person)
    
    if not history:
        return None
    
    # Add deletion event
    event_details = f"Person deleted with ID {person.id}"
    
    return add_history_event(history, "delete", event_details)

def get_person_history(person_id):
    """
    Get history record for a person
    
    Args:
        person_id (int): Person ID
    
    Returns:
        History or None: Person history record if found, None otherwise
    """
    try:
        person = Person.objects.get(id=person_id)
        return get_history(person)
    except Person.DoesNotExist:
        return None
