# User history tracking
from core.models import User
from django.utils import timezone
from core.services.history.initialization import (
    get_history, initialize_history, add_history_event, ensure_history_id
)

def record_user_creation(user):
    """
    Record user creation in history
    
    Args:
        user (User): Created user
        
    Returns:
        History: Created history record
    """
    # Ensure user has a history_id
    ensure_history_id(user)
    
    # Initialize a new history record
    history = initialize_history(
        title=user.username,
        event_type="create",
        event_details=f"User created with ID {user.id}",
        table_name='user',
        history_id=user.history_id
    )
    
    return history

def record_user_update(user, updated_fields):
    """
    Record user update in history
    
    Args:
        user (User): Updated user
        updated_fields (list): List of updated fields
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(user)
    
    if not history:
        return None
    
    # Make sure title stays updated
    history.title = user.username
    history.save(update_fields=['title'])
    
    # Add update event
    event_details = f"User updated: {', '.join(updated_fields)}"
    
    return add_history_event(history, "update", event_details)

def record_user_login(user):
    """
    Record user login in history
    
    Args:
        user (User): User who logged in
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(user)
    
    if not history:
        return None
    
    # Add login event
    event_details = f"User logged in at {user.last_login}"
    
    return add_history_event(history, "login", event_details)

def record_user_logout(user):
    """
    Record user logout in history
    
    Args:
        user (User): User who logged out
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(user)
    
    if not history:
        return None
    
    # Add logout event
    event_details = f"User logged out at {timezone.now()}"
    
    return add_history_event(history, "logout", event_details)

def record_user_password_change(user):
    """
    Record user password change in history
    
    Args:
        user (User): User who changed password
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(user)
    
    if not history:
        return None
    
    # Add password change event
    event_details = "User password changed"
    
    return add_history_event(history, "password_change", event_details)

def record_user_role_change(user, old_role, new_role):
    """
    Record user role change in history
    
    Args:
        user (User): User whose role changed
        old_role (str): Previous role
        new_role (str): New role
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(user)
    
    if not history:
        return None
    
    # Add role change event
    event_details = f"User role changed from '{old_role}' to '{new_role}'"
    
    return add_history_event(history, "role_change", event_details)

def record_user_email_change(user, old_email, new_email):
    """
    Record user email change in history
    
    Args:
        user (User): User whose email changed
        old_email (str): Previous email
        new_email (str): New email
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(user)
    
    if not history:
        return None
    
    # Add email change event
    event_details = f"User email changed from '{old_email}' to '{new_email}'"
    
    return add_history_event(history, "email_change", event_details)

def record_user_name_change(user, old_name, new_name):
    """
    Record user name change in history
    
    Args:
        user (User): User whose name changed
        old_name (str): Previous display name
        new_name (str): New display name
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(user)
    
    if not history:
        return None
    
    # Add name change event
    event_details = f"User name changed from '{old_name}' to '{new_name}'"
    
    return add_history_event(history, "name_change", event_details)

def record_user_deletion(user):
    """
    Record user deletion in history
    
    Args:
        user (User): User being deleted
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(user)
    
    if not history:
        return None
    
    # Add deletion event
    event_details = f"User deleted with ID {user.id}"
    
    return add_history_event(history, "delete", event_details)

def get_user_history(user_id):
    """
    Get history record for a user
    
    Args:
        user_id: User ID
        
    Returns:
        History or None: User history record if found, None otherwise
    """
    try:
        user = User.objects.get(id=user_id)
        return get_history(user)
    except User.DoesNotExist:
        return None
