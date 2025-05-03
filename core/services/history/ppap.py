# PPAP history tracking
from core.models import PPAP
from django.utils import timezone
from core.services.history.initialization import (
    get_history, initialize_history, add_history_event, ensure_history_id
)

def record_ppap_creation(ppap):
    """
    Record PPAP creation in history
    
    Args:
        ppap (PPAP): Created PPAP
        
    Returns:
        History: Created history record
    """
    # Ensure PPAP has a history_id
    ensure_history_id(ppap)
    
    # Initialize a new history record
    history = initialize_history(
        title=f"PPAP for Project {ppap.project_id}",
        event_type="create",
        event_details=f"PPAP created with level {ppap.level}",
        table_name='ppap',
        history_id=ppap.history_id
    )
    
    return history

def record_ppap_update(ppap, updated_fields):
    """
    Record PPAP update in history
    
    Args:
        ppap (PPAP): Updated PPAP
        updated_fields (list): List of updated fields
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(ppap)
    
    if not history:
        return None
    
    # Make sure title stays updated
    history.title = f"PPAP for Project {ppap.project_id}"
    history.save(update_fields=['title'])
    
    # Add update event
    event_details = f"PPAP updated: {', '.join(updated_fields)}"
    
    return add_history_event(history, "update", event_details)

def record_ppap_level_change(ppap, old_level, new_level):
    """
    Record PPAP level change in history
    
    Args:
        ppap (PPAP): PPAP object
        old_level (int): Previous PPAP level
        new_level (int): New PPAP level
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(ppap)
    
    if not history:
        return None
    
    # Add level change event
    event_details = f"PPAP level changed from {old_level} to {new_level}"
    
    return add_history_event(history, "level_change", event_details)

def record_ppap_status_change(ppap, old_status, new_status):
    """
    Record PPAP status change in history
    
    Args:
        ppap (PPAP): PPAP object
        old_status (str): Previous status
        new_status (str): New status
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(ppap)
    
    if not history:
        return None
    
    # Add status change event
    event_details = f"PPAP status changed from '{old_status}' to '{new_status}'"
    
    # Determine event type based on the new status
    event_type = "status_change"
    if new_status.lower() in ['completed', 'approved', 'finalized']:
        event_type = "complete"
    elif new_status.lower() in ['in_progress', 'started']:
        event_type = "start"
    elif new_status.lower() in ['review', 'under_review']:
        event_type = "review"
    
    return add_history_event(history, event_type, event_details)

def record_ppap_phase_completion(ppap, phase):
    """
    Record completion of a phase in PPAP
    
    Args:
        ppap (PPAP): PPAP object
        phase: Completed phase
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(ppap)
    
    if not history:
        return None
    
    # Add phase completion event
    event_details = f"Phase '{phase.template.name}' (ID: {phase.id}) completed"
    
    return add_history_event(history, "phase_complete", event_details)

def record_ppap_customer_submission(ppap, submission_date=None):
    """
    Record PPAP submission to customer
    
    Args:
        ppap (PPAP): PPAP object
        submission_date (datetime, optional): Date of submission (defaults to now)
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(ppap)
    
    if not history:
        return None
    
    # Use provided date or default to now
    if submission_date is None:
        submission_date = timezone.now()
    
    # Format date for display
    formatted_date = submission_date.strftime("%Y-%m-%d")
    
    # Add submission event
    event_details = f"PPAP submitted to customer on {formatted_date}"
    
    return add_history_event(history, "customer_submission", event_details)

def record_ppap_customer_decision(ppap, decision, comments=None):
    """
    Record customer decision on PPAP
    
    Args:
        ppap (PPAP): PPAP object
        decision (str): Customer decision (approved, rejected, etc.)
        comments (str, optional): Customer comments
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(ppap)
    
    if not history:
        return None
    
    # Add customer decision event
    event_details = f"Customer decision: {decision}"
    if comments:
        event_details += f". Comments: {comments}"
    
    # Determine event type based on decision
    event_type = "customer_decision"
    if decision.lower() in ['approved', 'accepted']:
        event_type = "approve"
    elif decision.lower() in ['rejected', 'denied']:
        event_type = "reject"
    elif decision.lower() in ['conditional', 'interim']:
        event_type = "conditional_approve"
    
    return add_history_event(history, event_type, event_details)

def record_ppap_deadline_change(ppap, old_deadline, new_deadline):
    """
    Record PPAP deadline change
    
    Args:
        ppap (PPAP): PPAP object
        old_deadline (datetime): Previous deadline
        new_deadline (datetime): New deadline
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(ppap)
    
    if not history:
        return None
    
    # Update history deadline field
    history.deadline = new_deadline
    
    # Format deadlines for display
    old_date = old_deadline.strftime("%Y-%m-%d") if old_deadline else "None"
    new_date = new_deadline.strftime("%Y-%m-%d") if new_deadline else "None"
    
    # Add deadline change event
    event_details = f"PPAP deadline changed from {old_date} to {new_date}"
    
    # Save the history with the deadline update
    history.save(update_fields=['deadline'])
    
    return add_history_event(history, "deadline_change", event_details)

def record_ppap_deletion(ppap):
    """
    Record PPAP deletion in history
    
    Args:
        ppap (PPAP): PPAP being deleted
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(ppap)
    
    if not history:
        return None
    
    # Add deletion event
    event_details = f"PPAP deleted with ID {ppap.id}"
    
    return add_history_event(history, "delete", event_details)

def get_ppap_history(ppap_id):
    """
    Get history record for a PPAP
    
    Args:
        ppap_id: PPAP ID
        
    Returns:
        History or None: PPAP history record if found, None otherwise
    """
    try:
        ppap = PPAP.objects.get(id=ppap_id)
        return get_history(ppap)
    except PPAP.DoesNotExist:
        return None

def record_ppap_progress(ppap, total_phases, completed_phases):
    """
    Record progress of phases completion in a PPAP
    
    Args:
        ppap (PPAP): PPAP object
        total_phases (int): Total number of phases
        completed_phases (int): Number of completed phases
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(ppap)
    
    if not history:
        return None
    
    # Calculate completion percentage
    completion_percentage = int((completed_phases / total_phases) * 100) if total_phases > 0 else 0
    
    # Add progress event
    event_details = f"PPAP progress: {completed_phases}/{total_phases} phases completed ({completion_percentage}%)"
    
    return add_history_event(history, "progress_update", event_details)
