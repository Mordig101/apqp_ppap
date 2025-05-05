# Phase history tracking
from core.models import Phase
from django.utils import timezone
import uuid
import json
from core.services.history.initialization import (
    get_history, initialize_history, add_history_event, ensure_history_id
)

def record_phase_creation(phase):
    """
    Record phase creation in history
    
    Args:
        phase (Phase): Created phase
        
    Returns:
        History: Created history record
    """
    from core.services.history.initialization import initialize_history
    
    history = initialize_history(
        title=phase.template.name,  # FIXED
        event_type="create",
        event_details=f"Phase created for PPAP {phase.ppap_id}",
        table_name='phase',
        history_id=phase.history_id
    )
    
    return history

def record_phase_update(phase, updated_fields=None):
    """
    Record phase update in history
    
    Args:
        phase (Phase): Updated phase
        updated_fields (list, optional): List of updated fields
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(phase)
    
    if not history:
        return None
    
    # Make sure title stays updated
    history.title = f"{phase.template.name} for PPAP {phase.ppap_id}"
    history.save(update_fields=['title'])
    
    # Add update event
    if updated_fields:
        event_details = f"Phase updated. Fields changed: {', '.join(updated_fields)}"
    else:
        event_details = "Phase updated."
    
    return add_history_event(history, "update", event_details)

def record_phase_status_change(phase, old_status, new_status):
    """
    Record phase status change in history
    
    Args:
        phase (Phase): Phase object
        old_status (str): Previous status
        new_status (str): New status
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(phase)
    
    if not history:
        return None
    
    # Add status change event
    event_details = f"Phase status changed from '{old_status}' to '{new_status}'"
    
    # Determine event type based on the new status
    event_type = "status_change"
    if new_status.lower() in ['completed', 'approved', 'finalized']:
        event_type = "complete"
    elif new_status.lower() in ['in_progress', 'started']:
        event_type = "start"
    elif new_status.lower() == 'not started':
        event_type = "reset"
    elif new_status.lower() in ['review', 'under_review']:
        event_type = "review"
    
    return add_history_event(history, event_type, event_details)

def record_phase_responsible_change(phase, old_responsible_id, new_responsible_id):
    """
    Record phase responsible person change in history
    
    Args:
        phase (Phase): Phase object
        old_responsible_id: ID of previous responsible person (can be None)
        new_responsible_id: ID of new responsible person (can be None)
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(phase)
    
    if not history:
        return None
    
    # Format user IDs for display
    old_username = "None" if old_responsible_id is None else f"User {old_responsible_id}"
    new_username = "None" if new_responsible_id is None else f"User {new_responsible_id}"
    
    # Determine event type and details
    if old_responsible_id is None and new_responsible_id is not None:
        event_type = "assign_responsible"
        event_details = f"Responsibility assigned to {new_username}"
    elif old_responsible_id is not None and new_responsible_id is None:
        event_type = "remove_responsible"
        event_details = f"Responsibility removed from {old_username}"
    else:
        event_type = "change_responsible"
        event_details = f"Responsibility changed from {old_username} to {new_username}"
    
    return add_history_event(history, event_type, event_details)

def record_phase_output_addition(phase, output):
    """
    Record addition of output to phase
    
    Args:
        phase (Phase): Phase object
        output: Output added to phase
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(phase)
    
    if not history:
        return None
    
    # Add output addition event
    event_details = f"Output '{output.template.name}' (ID: {output.id}) added to phase"
    
    return add_history_event(history, "output_add", event_details)

def record_phase_output_completion(phase, output):
    """
    Record completion of output in phase
    
    Args:
        phase (Phase): Phase object
        output: Completed output
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(phase)
    
    if not history:
        return None
    
    # Add output completion event
    event_details = f"Output '{output.template.name}' (ID: {output.id}) completed"
    
    return add_history_event(history, "output_complete", event_details)

def record_phase_deadline_change(phase, old_deadline, new_deadline):
    """
    Record phase deadline change
    
    Args:
        phase (Phase): Phase object
        old_deadline: Previous deadline (datetime)
        new_deadline: New deadline (datetime)
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(phase)
    
    if not history:
        return None
    
    # Update history deadline field
    history.deadline = new_deadline
    
    # Format deadlines for display
    old_date = old_deadline.strftime("%Y-%m-%d") if old_deadline else "None"
    new_date = new_deadline.strftime("%Y-%m-%d") if new_deadline else "None"
    
    # Add deadline change event
    event_details = f"Phase deadline changed from {old_date} to {new_date}"
    
    # Save the history with the deadline update
    history.save(update_fields=['deadline'])
    
    return add_history_event(history, "deadline_change", event_details)

def record_phase_review(phase, review_status, reviewer_id=None, comments=None):
    """
    Record phase review in history
    
    Args:
        phase (Phase): Phase object
        review_status (str): Review status
        reviewer_id (int, optional): ID of the reviewer
        comments (str, optional): Review comments
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(phase)
    
    if not history:
        return None
    
    # Create event details
    reviewer_info = f" by User {reviewer_id}" if reviewer_id else ""
    event_details = f"Phase reviewed{reviewer_info} with status: {review_status}"
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

def record_phase_deletion(phase):
    """
    Record phase deletion in history
    
    Args:
        phase (Phase): Phase being deleted
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(phase)
    
    if not history:
        return None
    
    # Add deletion event
    event_details = f"Phase deleted with ID {phase.id}"
    
    return add_history_event(history, "delete", event_details)

def get_phase_history(phase_id):
    """
    Get history record for a phase
    
    Args:
        phase_id: Phase ID
        
    Returns:
        History or None: Phase history record if found, None otherwise
    """
    try:
        phase = Phase.objects.get(id=phase_id)
        return get_history(phase)
    except Phase.DoesNotExist:
        return None

def record_phase_outputs_progress(phase, total_outputs, completed_outputs):
    """
    Record progress of outputs completion in a phase
    
    Args:
        phase (Phase): Phase object
        total_outputs (int): Total number of outputs in the phase
        completed_outputs (int): Number of completed outputs
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(phase)
    
    if not history:
        return None
    
    # Calculate completion percentage
    completion_percentage = int((completed_outputs / total_outputs) * 100) if total_outputs > 0 else 0
    
    # Add progress event
    event_details = f"Phase progress: {completed_outputs}/{total_outputs} outputs completed ({completion_percentage}%)"
    
    return add_history_event(history, "progress_update", event_details)
