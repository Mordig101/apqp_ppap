# Status changes logic (workflow to change status (we will stup the logic later)
from core.models import Project, PPAP, Phase, Output
from core.services.history.api import (
    record_project_update,
    record_ppap_update,
    record_phase_status_change,
    record_output_status_change
)

def change_project_status(project_id, new_status, user_id):
    """
    Change project status with workflow validation
    """
    project = Project.objects.get(id=project_id)
    old_status = project.status
    
    # Validate status transition
    valid_transitions = {
        'Planning': ['In Progress', 'On Hold', 'Cancelled'],
        'In Progress': ['Completed', 'On Hold', 'Cancelled'],
        'On Hold': ['Planning', 'In Progress', 'Cancelled'],
        'Completed': ['Archived'],
        'Cancelled': ['Archived'],
        'Archived': []
    }
    
    if new_status not in valid_transitions.get(old_status, []):
        raise ValueError(f"Invalid status transition from {old_status} to {new_status}")
    
    # Update status
    project.status = new_status
    project.save()
    
    # Record status change
    record_project_update(project, ['status'])
    
    return project

def change_ppap_status(ppap_id, new_status, user_id):
    """
    Change PPAP status with workflow validation
    """
    ppap = PPAP.objects.get(id=ppap_id)
    old_status = ppap.status
    
    # Validate status transition
    valid_transitions = {
        'Not Started': ['In Progress', 'Cancelled'],
        'In Progress': ['Completed', 'On Hold', 'Cancelled'],
        'On Hold': ['In Progress', 'Cancelled'],
        'Completed': ['Approved', 'Rejected'],
        'Approved': [],
        'Rejected': ['In Progress'],
        'Cancelled': []
    }
    
    if new_status not in valid_transitions.get(old_status, []):
        raise ValueError(f"Invalid status transition from {old_status} to {new_status}")
    
    # Update status
    ppap.status = new_status
    ppap.save()
    
    # Record status change
    record_ppap_update(ppap, ['status'])
    
    return ppap

def change_phase_status(phase_id, new_status, user_id):
    """
    Change phase status with workflow validation
    """
    phase = Phase.objects.get(id=phase_id)
    old_status = phase.status
    
    # Validate status transition
    valid_transitions = {
        'Not Started': ['In Progress', 'Cancelled'],
        'In Progress': ['Completed', 'On Hold', 'Cancelled'],
        'On Hold': ['In Progress', 'Cancelled'],
        'Completed': ['Approved', 'Rejected'],
        'Approved': [],
        'Rejected': ['In Progress'],
        'Cancelled': []
    }
    
    if new_status not in valid_transitions.get(old_status, []):
        raise ValueError(f"Invalid status transition from {old_status} to {new_status}")
    
    # Update status
    phase.status = new_status
    phase.save()
    
    # Record status change
    record_phase_status_change(phase, old_status, new_status)
    
    # Update PPAP status if needed
    if new_status == 'Completed':
        from core.services.phase.functions import update_ppap_status_from_phase
        update_ppap_status_from_phase(phase)
    
    return phase

def change_output_status(output_id, new_status, user_id):
    """
    Change output status with workflow validation
    """
    output = Output.objects.get(id=output_id)
    old_status = output.status
    
    # Validate status transition
    valid_transitions = {
        'Not Started': ['In Progress', 'Cancelled'],
        'In Progress': ['Completed', 'On Hold', 'Cancelled'],
        'On Hold': ['In Progress', 'Cancelled'],
        'Completed': ['Approved', 'Rejected'],
        'Approved': [],
        'Rejected': ['In Progress'],
        'Cancelled': [],
        'Deprecated': []
    }
    
    if new_status not in valid_transitions.get(old_status, []):
        raise ValueError(f"Invalid status transition from {old_status} to {new_status}")
    
    # Update status
    output.status = new_status
    output.save()
    
    # Record status change
    record_output_status_change(output, old_status, new_status)
    
    # Update phase status if needed
    if new_status == 'Completed':
        from core.services.output.functions import update_phase_status_from_output
        update_phase_status_from_output(output)
    
    return output
