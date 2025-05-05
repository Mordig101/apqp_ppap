from core.models import History
from django.utils import timezone
from django.db import transaction
import uuid

def update_history_dates(history_id, deadline=None, started_at=None, completed_at=None):
    """
    Update date attributes for a history record
    
    Args:
        history_id (UUID): History ID
        deadline (datetime, optional): New deadline date
        started_at (datetime, optional): New start date
        completed_at (datetime, optional): New completion date
        
    Returns:
        History: Updated history record
        
    Raises:
        History.DoesNotExist: If history record not found
    """
    # Get most recent history record with this ID
    history = History.objects.filter(history_id=history_id).order_by('-created_at').first()
    
    if not history:
        raise History.DoesNotExist(f"History with ID {history_id} not found")
    
    # Track which fields were updated
    updated_fields = []
    
    if deadline is not None:
        history.deadline = deadline
        updated_fields.append('deadline')
    
    if started_at is not None:
        history.started_at = started_at
        updated_fields.append('started_at')
    
    if completed_at is not None:
        history.completed_at = completed_at if not hasattr(history, 'completed_at') else history.completed_at
        updated_fields.append('completed_at')
    
    # Save the changes
    if updated_fields:
        history.save(update_fields=updated_fields)
        
        # Record the date updates in a new history event
        from core.services.history.initialization import add_history_event
        
        updated_fields_str = ', '.join(updated_fields)
        event_details = f"Updated history dates: {updated_fields_str}"
        add_history_event(history, "date_update", event_details)
    
    return history

def set_entity_deadline(entity, deadline, table_name=None):
    """
    Set or update the deadline for an entity
    
    Args:
        entity: Entity object with history_id attribute
        deadline (datetime): New deadline date
        table_name (str, optional): Table name, if different from entity's class
        
    Returns:
        dict: Result with history and entity
        
    Raises:
        ValueError: If entity has no history_id
    """
    if not hasattr(entity, 'history_id') or not entity.history_id:
        raise ValueError(f"Entity {entity} has no history_id")
    
    # Get table name if not provided
    if not table_name:
        table_name = entity.__class__.__name__.lower()
    
    # Get current history record
    from core.services.history.initialization import get_history
    history = get_history(entity, table_name)
    
    # Get current deadline for event recording
    old_deadline = history.deadline if history else None
    
    # Update deadline
    updated_history = update_history_dates(entity.history_id, deadline=deadline)
    
    # Record specific event based on entity type
    if table_name == 'phase':
        from core.services.history.phase import record_phase_deadline_change
        record_phase_deadline_change(entity, old_deadline, deadline)
    elif table_name == 'output':
        from core.services.history.output import record_output_deadline_change
        record_output_deadline_change(entity, old_deadline, deadline)
    else:
        # Generic deadline change event
        from core.services.history.initialization import add_history_event
        event_details = f"{table_name.capitalize()} deadline updated"
        add_history_event(updated_history, "deadline_change", event_details)
    
    return {
        'history': updated_history,
        'entity': entity
    }

def get_entity_deadline(entity, table_name=None):
    """
    Get deadline for an entity
    
    Args:
        entity: Entity object with history_id attribute
        table_name (str, optional): Table name, if different from entity's class
        
    Returns:
        datetime or None: Current deadline or None if not set
        
    Raises:
        ValueError: If entity has no history_id
    """
    if not hasattr(entity, 'history_id') or not entity.history_id:
        raise ValueError(f"Entity {entity} has no history_id")
    
    # Get table name if not provided
    if not table_name:
        table_name = entity.__class__.__name__.lower()
    
    # Get current history record
    from core.services.history.initialization import get_history
    history = get_history(entity, table_name)
    
    return history.deadline if history else None

@transaction.atomic
def bulk_update_entity_deadlines(entity_ids, deadline, entity_class, table_name=None):
    """
    Update deadlines for multiple entities at once
    
    Args:
        entity_ids (list): List of entity IDs
        deadline (datetime): Deadline to set
        entity_class (class): Entity model class
        table_name (str, optional): Table name
        
    Returns:
        dict: Results with count and updated entities
    """
    if not table_name:
        table_name = entity_class.__name__.lower()
    
    entities = entity_class.objects.filter(id__in=entity_ids)
    updated = 0
    failed = 0
    updated_entities = []
    
    for entity in entities:
        try:
            result = set_entity_deadline(entity, deadline, table_name)
            updated += 1
            updated_entities.append(result['entity'].id)
        except Exception:
            failed += 1
    
    return {
        'updated_count': updated,
        'failed_count': failed,
        'total': len(entity_ids),
        'updated_entities': updated_entities
    }