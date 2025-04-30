# Define project possible action and services
from django.db import transaction
from core.models import Phase, Output
from core.services.history.api import (
    record_phase_update,
    record_phase_status_change
)

@transaction.atomic
def update_phase(phase_id, data):
    """
    Update phase details
    """
    phase = Phase.objects.get(id=phase_id)
    
    # Check for status change
    old_status = phase.status
    new_status = data.get('status', old_status)
    
    # Update fields
    updated_fields = []
    for field, value in data.items():
        if hasattr(phase, field) and getattr(phase, field) != value:
            setattr(phase, field, value)
            updated_fields.append(field)
    
    if updated_fields:
        phase.save()
        record_phase_update(phase, updated_fields)
    
    # Handle status change
    if 'status' in updated_fields and old_status != new_status:
        record_phase_status_change(phase, old_status, new_status)
        
        # Update PPAP status if needed
        update_ppap_status_from_phase(phase)
    
    return phase

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
