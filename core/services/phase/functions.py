# Define project possible action and services
from django.db import transaction
from core.models import Phase, Output, PhaseTemplate, PPAP, User, History
from core.services.history.phase import (  # Correct import path
    record_phase_creation, 
    record_phase_update,
    record_phase_status_change,
    record_phase_responsible_change,
    record_phase_deadline_change,
    get_history
)
from django.utils.dateparse import parse_datetime

@transaction.atomic
def update_phase(phase_id, data):
    """Update phase details"""
    phase = Phase.objects.get(id=phase_id)
    
    # Extract history data if present
    history_attrs = data.pop('history', None)
    
    # Track original values for recording changes
    old_status = phase.status
    old_responsible_id = phase.responsible_id if phase.responsible else None
    
    # Update fields
    updated_fields = []
    for field, value in data.items():
        if hasattr(phase, field) and getattr(phase, field) != value:
            setattr(phase, field, value)
            updated_fields.append(field)
    
    # Save the phase if fields were updated
    if updated_fields:
        phase.save()
        
        # Use our own fixed version of record_phase_update to ensure events are recorded
        history = custom_record_phase_update(phase, updated_fields)
        
        # Handle specific field changes that need separate events
        # Check for status change
        new_status = phase.status
        if 'status' in updated_fields and old_status != new_status:
            record_phase_status_change(phase, old_status, new_status)
            
            # Update PPAP status if needed
            update_ppap_status_from_phase(phase)
        
        # Check for responsible change
        new_responsible_id = phase.responsible_id if phase.responsible else None
        if 'responsible_id' in updated_fields and old_responsible_id != new_responsible_id:
            record_phase_responsible_change(phase, old_responsible_id, new_responsible_id)
    
    # Update history attributes if provided
    if history_attrs and isinstance(history_attrs, dict):
        update_phase_history(phase_id, history_attrs)
    
    return phase

def custom_record_phase_update(phase, updated_fields=None):
    """
    An improved version of record_phase_update that ensures events are recorded properly
    """
    import json
    from django.utils import timezone
    from core.services.history.initialization import get_history
    
    # Get existing history record
    history = get_history(phase)
    
    if not history:
        return None
    
    # Make sure title stays updated
    history.title = f"{phase.template.name} for PPAP {phase.ppap_id}"
    
    # Add update event
    if updated_fields:
        event_details = f"Phase updated. Fields changed: {', '.join(updated_fields)}"
    else:
        event_details = "Phase updated."
    
    # Custom implementation of add_history_event to ensure proper event recording
    try:
        # Try to parse existing events as JSON array
        if history.event:
            try:
                events = json.loads(history.event)
                if not isinstance(events, list):
                    # If it parsed as a single object, convert to a list
                    events = [events]
            except (json.JSONDecodeError, TypeError):
                # If it's not valid JSON, create a new list with the existing event as text
                events = [{
                    "type": "create",
                    "details": history.event,
                    "timestamp": history.created_at.isoformat() if history.created_at else timezone.now().isoformat()
                }]
        else:
            # No existing events
            events = []
        
        # Add the new event
        new_event = {
            "type": "update",
            "details": event_details,
            "timestamp": timezone.now().isoformat()
        }
        events.append(new_event)
        
        # Store back as JSON
        history.event = json.dumps(events)
        history.updated_at = timezone.now()
        history.save(update_fields=['event', 'updated_at', 'title'])
        
        return history
    except Exception as e:
        print(f"Error adding history event: {str(e)}")
        # Fallback - just append text
        if history.event:
            history.event += f"\nupdate: {event_details}"
        else:
            history.event = f"update: {event_details}"
        history.updated_at = timezone.now()
        history.save(update_fields=['event', 'updated_at', 'title'])
        
        return history

@transaction.atomic
def update_phase_history(phase_id, history_attrs):
    """
    Update history attributes for a phase
    
    Args:
        phase_id: ID of the phase
        history_attrs: Dictionary with history attributes
            - title: Custom history title
            - deadline: Deadline date (ISO format string)
            - started_at: Start date (ISO format string)
            - finished_at: Completion date (ISO format string)
    
    Returns:
        History: Updated history record or None if not found
    """
    from core.services.history.phase import get_phase_history
    from core.services.history.initialization import update_history_attributes
    
    # Get phase
    phase = Phase.objects.get(id=phase_id)
    
    # Get history record
    history = get_phase_history(phase_id)
    
    if not history:
        return None
    
    # Use the generic function to update history attributes and record events
    updated_history, changed_attrs = update_history_attributes(
        history=history,
        attributes=history_attrs,
        auto_update_related_model=True,
        related_model=phase
    )
    
    # Special handling for deadline changes if needed
    if 'deadline' in history_attrs and history_attrs['deadline'] and 'deadline' in [attr.split()[0] for attr in changed_attrs]:
        from core.services.history.phase import record_phase_deadline_change
        # Record specific deadline change event (if your system needs it)
        try:
            record_phase_deadline_change(
                phase, 
                parse_datetime(history_attrs['deadline']),
                history.deadline
            )
        except:
            pass
    
    return updated_history

def update_ppap_status_from_phase(phase):
    """
    Update PPAP status based on phase status changes
    """
    ppap = phase.ppap
    
    # Get all phases for this PPAP
    phases = ppap.phases.all()
    
    # Check if all phases are completed
    all_completed = all(p.status == 'Completed' for p in phases)
    
    if all_completed and ppap.status != 'Completed':
        ppap.status = 'Completed'
        ppap.save()
        
        # Record PPAP completion in history
        from core.services.history.initialization import initialize_history
        initialize_history(
            title=f"PPAP for Project {ppap.project_id}",
            event=f"PPAP marked as Completed as all phases are completed",
            table_name='ppap',
            history_id=ppap.history_id
        )
    
    # Check if any phase is in progress
    any_in_progress = any(p.status == 'In Progress' for p in phases)
    
    if any_in_progress and ppap.status == 'Not Started':
        ppap.status = 'In Progress'
        ppap.save()
        
        # Record PPAP status change in history
        from core.services.history.initialization import initialize_history
        initialize_history(
            title=f"PPAP for Project {ppap.project_id}",
            event=f"PPAP marked as In Progress as at least one phase is in progress",
            table_name='ppap',
            history_id=ppap.history_id
        )

def get_phase_details(phase_id):
    """
    Get comprehensive phase details including all outputs
    """
    phase = Phase.objects.get(id=phase_id)
    
    # Get outputs
    outputs = phase.outputs.all()
    
    output_details = []
    for output in outputs:
        documents = output.documents.all()
        
        output_details.append({
            'id': output.id,
            'name': output.template.name,
            'description': output.description,
            'status': output.status,
            'responsible': output.user.username if output.user else None,
            'documents': [
                {
                    'id': doc.id,
                    'name': doc.name,
                    'version': doc.version,
                    'status': doc.status
                } for doc in documents
            ]
        })
    
    # Compile phase details
    phase_details = {
        'id': phase.id,
        'name': phase.template.name,
        'status': phase.status,
        'responsible': phase.responsible.username if phase.responsible else None,
        'ppap_id': phase.ppap_id,
        'outputs': output_details
    }
    
    return phase_details

@transaction.atomic
def create_phase(template_id, ppap_id, responsible_id=None, status='Not Started', history_attrs=None):
    """
    Create a new phase with optional history attributes
    
    Args:
        template_id: ID of PhaseTemplate
        ppap_id: ID of PPAP
        responsible_id: ID of responsible User (optional)
        status: Initial status (default: 'Not Started')
        history_attrs: Dictionary with history attributes (optional)
            - title: Custom history title
            - deadline: Deadline date (ISO format string)
            - started_at: Start date (ISO format string)
            - finished_at: Completion date (ISO format string)
    
    Returns:
        Phase: Created phase
    """
    # Get required objects
    template = PhaseTemplate.objects.get(id=template_id)
    ppap = PPAP.objects.get(id=ppap_id)
    
    responsible = None
    if responsible_id:
        responsible = User.objects.get(id=responsible_id)
    
    # Create phase
    phase = Phase.objects.create(
        template=template,
        ppap=ppap,
        responsible=responsible,
        status=status
    )
    
    # Let the service create the history record
    history = record_phase_creation(phase)
    
    # Update history attributes if provided
    if history and history_attrs and isinstance(history_attrs, dict):
        update_phase_history(phase.id, history_attrs)
    
    return phase
