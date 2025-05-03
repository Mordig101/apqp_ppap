# Project history tracking
from core.models import Project
from django.utils import timezone
from core.services.history.initialization import (
    get_history, initialize_history, add_history_event, ensure_history_id
)

def record_project_creation(project):
    """
    Record project creation in history
    
    Args:
        project (Project): Created project
        
    Returns:
        History: Created history record
    """
    # Ensure project has a history_id
    ensure_history_id(project)
    
    # Initialize a new history record
    history = initialize_history(
        title=project.name,
        event_type="create",
        event_details=f"Project created with ID {project.id}",
        table_name='project',
        history_id=project.history_id
    )
    
    return history

def record_project_update(project, updated_fields):
    """
    Record project update in history
    
    Args:
        project (Project): Updated project
        updated_fields (list): List of updated fields
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(project)
    
    if not history:
        return None
    
    # Make sure title stays updated
    history.title = project.name
    history.save(update_fields=['title'])
    
    # Add update event
    event_details = f"Project updated: {', '.join(updated_fields)}"
    
    return add_history_event(history, "update", event_details)

def record_project_name_change(project, old_name, new_name):
    """
    Record project name change in history
    
    Args:
        project (Project): Project object
        old_name (str): Previous project name
        new_name (str): New project name
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(project)
    
    if not history:
        return None
    
    # Update the title to reflect the new name
    history.title = new_name
    history.save(update_fields=['title'])
    
    # Add name change event
    event_details = f"Project name changed from '{old_name}' to '{new_name}'"
    
    return add_history_event(history, "name_change", event_details)

def record_project_status_change(project, old_status, new_status):
    """
    Record project status change in history
    
    Args:
        project (Project): Project object
        old_status (str): Previous status
        new_status (str): New status
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(project)
    
    if not history:
        return None
    
    # Add status change event
    event_details = f"Project status changed from '{old_status}' to '{new_status}'"
    
    # Determine event type based on status
    event_type = "status_change"
    if new_status.lower() in ['active', 'started']:
        event_type = "activate"
    elif new_status.lower() in ['on_hold', 'paused']:
        event_type = "pause"
    elif new_status.lower() in ['completed', 'finished']:
        event_type = "complete"
    elif new_status.lower() in ['canceled']:
        event_type = "cancel"
    
    return add_history_event(history, event_type, event_details)

def record_project_customer_change(project, old_customer_id, new_customer_id):
    """
    Record project customer change in history
    
    Args:
        project (Project): Project object
        old_customer_id: ID of previous customer
        new_customer_id: ID of new customer
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(project)
    
    if not history:
        return None
    
    # Add customer change event
    event_details = f"Project customer changed from ID {old_customer_id} to ID {new_customer_id}"
    
    return add_history_event(history, "customer_change", event_details)

def record_project_team_member_addition(project, user_id, role=None):
    """
    Record addition of team member to project
    
    Args:
        project (Project): Project object
        user_id: ID of added user
        role (str, optional): Role of the team member
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(project)
    
    if not history:
        return None
    
    # Add team member addition event
    role_info = f" as {role}" if role else ""
    event_details = f"User {user_id} added to project{role_info}"
    
    return add_history_event(history, "team_member_add", event_details)

def record_project_team_member_removal(project, user_id):
    """
    Record removal of team member from project
    
    Args:
        project (Project): Project object
        user_id: ID of removed user
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(project)
    
    if not history:
        return None
    
    # Add team member removal event
    event_details = f"User {user_id} removed from project"
    
    return add_history_event(history, "team_member_remove", event_details)

def record_project_ppap_creation(project, ppap_id):
    """
    Record PPAP creation for project
    
    Args:
        project (Project): Project object
        ppap_id: ID of created PPAP
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(project)
    
    if not history:
        return None
    
    # Add PPAP creation event
    event_details = f"PPAP created with ID {ppap_id} for project"
    
    return add_history_event(history, "ppap_create", event_details)

def record_project_deadline_change(project, old_deadline, new_deadline):
    """
    Record project deadline change
    
    Args:
        project (Project): Project object
        old_deadline (datetime): Previous deadline
        new_deadline (datetime): New deadline
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(project)
    
    if not history:
        return None
    
    # Update history deadline field
    history.deadline = new_deadline
    
    # Format deadlines for display
    old_date = old_deadline.strftime("%Y-%m-%d") if old_deadline else "None"
    new_date = new_deadline.strftime("%Y-%m-%d") if new_deadline else "None"
    
    # Add deadline change event
    event_details = f"Project deadline changed from {old_date} to {new_date}"
    
    # Save the history with the deadline update
    history.save(update_fields=['deadline'])
    
    return add_history_event(history, "deadline_change", event_details)

def record_project_deletion(project):
    """
    Record project deletion in history
    
    Args:
        project (Project): Project being deleted
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(project)
    
    if not history:
        return None
    
    # Add deletion event
    event_details = f"Project deleted with ID {project.id}"
    
    return add_history_event(history, "delete", event_details)

def get_project_history(project_id):
    """
    Get history record for a project
    
    Args:
        project_id: Project ID
        
    Returns:
        History or None: Project history record if found, None otherwise
    """
    try:
        project = Project.objects.get(id=project_id)
        return get_history(project)
    except Project.DoesNotExist:
        return None
