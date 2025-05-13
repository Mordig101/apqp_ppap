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

def update_history_attributes(history, attributes, auto_update_related_model=True, related_model=None):
    """
    Update history attributes and record the changes as events
    
    Args:
        history (History): History record to update
        attributes (dict): Dictionary with history attributes
            - title: Custom history title
            - deadline: Deadline date (ISO format string)
            - started_at: Start date (ISO format string)
            - finished_at: Completion date (ISO format string)
        auto_update_related_model (bool): Whether to update the related model's status based on date changes
        related_model: The related model instance (optional, required if auto_update_related_model is True)
            
    Returns:
        History: Updated history record
        list: List of attributes that were changed
    """
    import json
    from django.utils import timezone
    from django.utils.dateparse import parse_datetime
    
    if not history:
        return None, []
    
    # Track history attribute changes to record them properly
    changed_attributes = []
    
    # Track if we need to update related model status based on dates
    status_updated = False
    
    # Update title if provided
    if 'title' in attributes and attributes['title']:
        old_title = history.title
        history.title = attributes['title']
        if old_title != attributes['title']:
            changed_attributes.append(f"title changed from '{old_title}' to '{history.title}'")
    
    # Update deadline if provided
    if 'deadline' in attributes and attributes['deadline']:
        deadline_str = attributes['deadline']
        deadline = parse_datetime(deadline_str)
        
        if deadline:
            old_deadline = history.deadline
            history.deadline = deadline
            
            if old_deadline:
                changed_attributes.append(f"deadline changed from {old_deadline.strftime('%Y-%m-%d')} to {deadline.strftime('%Y-%m-%d')}")
            else:
                changed_attributes.append(f"deadline set to {deadline.strftime('%Y-%m-%d')}")
    
    # Update started_at if provided
    if 'started_at' in attributes and attributes['started_at']:
        started_at_str = attributes['started_at']
        started_at = parse_datetime(started_at_str)
        
        if started_at:
            old_started_at = history.started_at
            history.started_at = started_at
            
            # Add to changed attributes
            if old_started_at:
                changed_attributes.append(f"start date changed from {old_started_at.strftime('%Y-%m-%d')} to {started_at.strftime('%Y-%m-%d')}")
            else:
                changed_attributes.append(f"start date set to {started_at.strftime('%Y-%m-%d')}")
            
            # If setting started_at and related model is not started,
            # update model status to In Progress
            if auto_update_related_model and related_model and hasattr(related_model, 'status'):
                if related_model.status == 'Not Started':
                    old_status = related_model.status
                    related_model.status = 'In Progress'
                    related_model.save(update_fields=['status'])
                    status_updated = True
                    
                    # Add a status change event in history
                    add_history_event(
                        history,
                        "status_change",
                        f"{related_model.__class__.__name__} status changed from '{old_status}' to 'In Progress'"
                    )
    
    # Update finished_at if provided
    if 'finished_at' in attributes and attributes['finished_at']:
        finished_at_str = attributes['finished_at']
        finished_at = parse_datetime(finished_at_str)
        
        if finished_at:
            old_finished_at = history.finished_at
            history.finished_at = finished_at
            
            # Add to changed attributes
            if old_finished_at:
                changed_attributes.append(f"completion date changed from {old_finished_at.strftime('%Y-%m-%d')} to {finished_at.strftime('%Y-%m-%d')}")
            else:
                changed_attributes.append(f"completion date set to {finished_at.strftime('%Y-%m-%d')}")
            
            # If setting finished_at and related model is not completed,
            # update model status to Completed
            if auto_update_related_model and not status_updated and related_model and hasattr(related_model, 'status'):
                if related_model.status != 'Completed':
                    old_status = related_model.status
                    related_model.status = 'Completed'
                    related_model.save(update_fields=['status'])
                    
                    # Add a status change event in history
                    add_history_event(
                        history,
                        "status_change",
                        f"{related_model.__class__.__name__} status changed from '{old_status}' to 'Completed'"
                    )
    
    # Record the history attribute changes as an event if any changes were made
    if changed_attributes:
        add_history_event(
            history,
            "history_update",
            f"History attributes updated: {'; '.join(changed_attributes)}"
        )
    
    # Save history changes
    history.save()
    
    return history, changed_attributes
