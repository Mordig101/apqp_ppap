# Output history tracking
from core.models import Output
from django.utils import timezone
from core.services.history.initialization import (
    get_history, initialize_history, add_history_event, ensure_history_id
)

def record_output_creation(output):
    """
    Record output creation in history
    
    Args:
        output (Output): Created output
        
    Returns:
        History: Created history record
    """
    # Ensure output has a history_id
    ensure_history_id(output)
    
    # Initialize a new history record
    history = initialize_history(
        title=f"{output.template.name} for Phase {output.phase_id}",
        event_type="create",
        event_details=f"Output created based on template {output.template.id}",
        table_name='output',
        history_id=output.history_id
    )
    
    return history

def record_output_update(output, updated_fields):
    """
    Record output update in history
    
    Args:
        output (Output): Updated output
        updated_fields (list): List of fields that were updated
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(output)
    
    if not history:
        return None
        
    # Make sure title stays updated
    history.title = f"{output.template.name} for Phase {output.phase_id}"
    history.save(update_fields=['title'])
    
    # Add update event
    event_details = f"Output updated: {', '.join(updated_fields)}"
    
    return add_history_event(history, "update", event_details)

def record_output_status_change(output, old_status, new_status):
    """
    Record output status change in history
    
    Args:
        output (Output): Output object
        old_status (str): Previous status
        new_status (str): New status
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(output)
    
    if not history:
        return None
        
    # Make sure title stays updated
    history.title = f"{output.template.name} for Phase {output.phase_id}"
    history.save(update_fields=['title'])
    
    # Add status change event
    event_details = f"Output status changed from {old_status} to {new_status}"
    
    # Determine event type based on the new status
    event_type = "status_change"
    if new_status.lower() in ['completed', 'approved', 'finalized']:
        event_type = "complete"
    elif new_status.lower() in ['in_progress', 'started']:
        event_type = "start"
    elif new_status.lower() in ['review', 'under_review']:
        event_type = "review"
    
    return add_history_event(history, event_type, event_details)

def record_output_document_upload(output, document):
    """
    Record document upload for an output
    
    Args:
        output (Output): Output object
        document (Document): Uploaded document
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(output)
    
    if not history:
        return None
        
    # Make sure title stays updated
    history.title = f"{output.template.name} for Phase {output.phase_id}"
    history.save(update_fields=['title'])
    
    # Add document upload event
    event_details = f"Document '{document.name}' (version {document.version}) uploaded"
    
    return add_history_event(history, "document_upload", event_details)

def record_output_responsibility_change(output, old_user_id, new_user_id):
    """
    Record responsibility change for an output
    
    Args:
        output (Output): Output object
        old_user_id: ID of previous responsible user (can be None)
        new_user_id: ID of new responsible user (can be None)
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(output)
    
    if not history:
        return None
        
    # Make sure title stays updated
    history.title = f"{output.template.name} for Phase {output.phase_id}"
    history.save(update_fields=['title'])
    
    # Format user IDs for display
    old_username = "None" if not old_user_id else f"User {old_user_id}"
    new_username = "None" if not new_user_id else f"User {new_user_id}"
    
    # Determine event type and details
    if old_user_id is None and new_user_id is not None:
        event_type = "assign_responsible"
        event_details = f"Responsibility assigned to {new_username}"
    elif old_user_id is not None and new_user_id is None:
        event_type = "remove_responsible"
        event_details = f"Responsibility removed from {old_username}"
    else:
        event_type = "change_responsible"
        event_details = f"Responsibility changed from {old_username} to {new_username}"
    
    return add_history_event(history, event_type, event_details)

def record_output_deletion(output):
    """
    Record output deletion in history
    
    Args:
        output (Output): Output being deleted
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(output)
    
    if not history:
        return None
        
    # Make sure title stays updated
    history.title = f"{output.template.name} for Phase {output.phase_id}"
    history.save(update_fields=['title'])
    
    # Add deletion event
    event_details = f"Output deleted with ID {output.id}"
    
    return add_history_event(history, "delete", event_details)

def record_output_review(output, review_status, reviewer_id=None, comments=None):
    """
    Record output review in history
    
    Args:
        output (Output): Output object
        review_status (str): Review status
        reviewer_id (int, optional): ID of the reviewer
        comments (str, optional): Review comments
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(output)
    
    if not history:
        return None
        
    # Make sure title stays updated
    history.title = f"{output.template.name} for Phase {output.phase_id}"
    history.save(update_fields=['title'])
    
    # Create event details
    reviewer_info = f" by User {reviewer_id}" if reviewer_id else ""
    event_details = f"Output reviewed{reviewer_info} with status: {review_status}"
    if comments:
        event_details += f". Comments: {comments}"
    
    # Determine event type based on review status
    event_type = "review"
    if review_status.lower() in ['approved', 'accepted']:
        event_type = "approve"
    elif review_status.lower() in ['rejected', 'denied']:
        event_type = "reject"
    elif review_status.lower() in ['completed']:
        event_type = "complete"
    
    return add_history_event(history, event_type, event_details)

def record_output_deadline_change(output, old_deadline, new_deadline):
    """
    Record output deadline change in history
    
    Args:
        output (Output): Output object
        old_deadline: Previous deadline (datetime)
        new_deadline: New deadline (datetime)
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(output)
    
    if not history:
        return None
        
    # Make sure title stays updated
    history.title = f"{output.template.name} for Phase {output.phase_id}"
    
    # Update history deadline field
    history.deadline = new_deadline
    history.save(update_fields=['title', 'deadline'])
    
    # Format deadlines for display
    old_date = old_deadline.strftime("%Y-%m-%d") if old_deadline else "None"
    new_date = new_deadline.strftime("%Y-%m-%d") if new_deadline else "None"
    
    # Add deadline change event
    event_details = f"Output deadline changed from {old_date} to {new_date}"
    
    return add_history_event(history, "deadline_change", event_details)

def get_output_history(output_id):
    """
    Get history record for an output
    
    Args:
        output_id: Output ID
        
    Returns:
        History or None: Output history record if found, None otherwise
    """
    try:
        output = Output.objects.get(id=output_id)
        return get_history(output)
    except Output.DoesNotExist:
        return None
