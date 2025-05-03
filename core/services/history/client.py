from core.models import Client
from django.utils import timezone
import uuid
import json
from core.services.history.initialization import (
    get_history, initialize_history, add_history_event, ensure_history_id
)

def record_client_creation(client):
    """
    Record client creation in history
    
    Args:
        client: Client object
        
    Returns:
        History: Created history record
    """
    # Ensure client has a history_id
    ensure_history_id(client)
    
    # Initialize a new history record
    history = initialize_history(
        title=client.name,
        event_type="create",
        event_details=f"Client created with ID {client.id}",
        table_name='client',
        history_id=client.history_id
    )
    
    return history

def record_client_update(client, updated_fields):
    """
    Record client update in history
    
    Args:
        client: Client object
        updated_fields: List of updated field names
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(client)
    
    if not history:
        return None
    
    # Add update event
    event_details = f"Client updated. Fields changed: {', '.join(updated_fields)}"
    
    return add_history_event(history, "update", event_details)

def record_client_name_change(client, old_name, new_name):
    """
    Record client name change in history
    
    Args:
        client: Client object
        old_name: Previous name
        new_name: New name
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(client)
    
    if not history:
        return None
    
    # Add name change event
    event_details = f"Client name changed from '{old_name}' to '{new_name}'"
    
    # Update the history title to reflect the new name
    history.title = new_name
    history.save(update_fields=['title'])
    
    return add_history_event(history, "name_change", event_details)

def record_client_status_change(client, old_status, new_status):
    """
    Record client status change in history
    
    Args:
        client: Client object
        old_status: Previous status
        new_status: New status
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(client)
    
    if not history:
        return None
    
    # Add status change event
    event_details = f"Client status changed from '{old_status}' to '{new_status}'"
    
    # Determine event type based on status
    event_type = "status_change"
    if new_status.lower() in ['active', 'approved']:
        event_type = "activate"
    elif new_status.lower() in ['inactive', 'suspended']:
        event_type = "deactivate"
    elif new_status.lower() in ['complete', 'finished']:
        event_type = "complete"
    
    return add_history_event(history, event_type, event_details)

def record_client_deletion(client):
    """
    Record client deletion in history
    
    Args:
        client: Client object
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(client)
    
    if not history:
        return None
    
    # Add deletion event
    event_details = f"Client deleted with ID {client.id}"
    
    return add_history_event(history, "delete", event_details)

def get_client_history(client_id):
    """
    Get history record for a client
    
    Args:
        client_id (int): Client ID
    
    Returns:
        History or None: Client history record if found, None otherwise
    """
    try:
        client = Client.objects.get(id=client_id)
        return get_history(client)
    except Client.DoesNotExist:
        return None
