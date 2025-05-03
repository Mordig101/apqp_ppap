import uuid
import json
from core.models import History
from django.utils import timezone

def generate_history_id(table_name):
    """
    Generate a unique history ID for a new record
    """
    return f"{uuid.uuid4().hex}{table_name}"

def initialize_history(title, event_type, event_details, table_name, history_id=None):
    """
    Initialize a history record with events stored as JSON
    
    Args:
        title (str): History title
        event_type (str): Type of event (create, update, delete, etc.)
        event_details (str): Details about the event
        table_name (str): Name of the related table
        history_id (str, optional): History ID if already generated
        
    Returns:
        History: Created history record
    """
    if not history_id:
        history_id = generate_history_id(table_name)
    
    # Create initial event as a list with one item
    now = timezone.now().isoformat()
    initial_event = [{
        "type": event_type,
        "details": event_details,
        "timestamp": now
    }]
    
    # Store events as JSON string
    history = History.objects.create(
        id=history_id,
        title=title,
        event=json.dumps(initial_event),
        table_name=table_name,
        started_at=timezone.now() if event_type == 'create' else None
    )
    
    return history

def add_history_event(history, event_type, event_details):
    """
    Add a new event to an existing history record
    
    Args:
        history (History): Existing history record
        event_type (str): Type of event (create, update, delete, etc.)
        event_details (str): Details about the event
        
    Returns:
        History: Updated history record
    """
    # Parse existing events
    try:
        existing_events = json.loads(history.event)
    except (json.JSONDecodeError, TypeError):
        # If existing event isn't valid JSON, start a new event list
        existing_events = []
    
    # Ensure existing_events is a list
    if not isinstance(existing_events, list):
        existing_events = []
    
    # Create new event
    now = timezone.now()
    new_event = {
        "type": event_type,
        "details": event_details,
        "timestamp": now.isoformat()
    }
    
    # Add new event to the list
    existing_events.append(new_event)
    
    # Update history record
    history.event = json.dumps(existing_events)
    
    # Update appropriate timestamp fields based on event type
    if event_type == 'create' and not history.started_at:
        history.started_at = now
    elif event_type == 'update':
        history.updated_at = now
    elif event_type in ['complete', 'approve', 'finalize']:
        history.finished_at = now
    elif event_type == 'delete':
        history.finished_at = now
    
    # Save history with updated fields
    update_fields = ['event']
    if event_type == 'create' and not history.started_at:
        update_fields.append('started_at')
    if history.updated_at:
        update_fields.append('updated_at')
    if history.finished_at:
        update_fields.append('finished_at')
    
    history.save(update_fields=update_fields)
    
    return history

def get_history(model_instance):
    """
    Get existing history record for a model instance
    
    Args:
        model_instance: Model instance with history_id attribute
        
    Returns:
        History or None: The history record if found, None otherwise
    """
    # Check if model has history_id
    if not hasattr(model_instance, 'history_id') or not model_instance.history_id:
        return None
    
    # Try to get existing history
    try:
        return History.objects.get(id=model_instance.history_id)
    except History.DoesNotExist:
        return None

def ensure_history_id(model_instance):
    """
    Ensure the model instance has a history_id
    
    Args:
        model_instance: Model instance 
        
    Returns:
        str: The history_id (existing or newly created)
    """
    if not hasattr(model_instance, 'history_id') or not model_instance.history_id:
        model_instance.history_id = generate_history_id(model_instance._meta.model_name)
        model_instance.save(update_fields=['history_id'])
    
    return model_instance.history_id
