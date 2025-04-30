from datetime import datetime, timedelta
from django.db import transaction
from core.models import Project, PPAP, Phase, Output, History

def set_project_timeline(project_id, deadline):
    """
    Set project timeline with deadline and calculate phase deadlines
    """
    project = Project.objects.get(id=project_id)
    ppap = project.ppap
    
    # Update history record with deadline
    history = History.objects.get(id=project.history_id)
    history.deadline = deadline
    history.save()
    
    # Calculate phase deadlines
    phases = Phase.objects.filter(ppap=ppap).order_by('template__order')
    total_phases = phases.count()
    
    if total_phases > 0:
        # Calculate time per phase
        now = datetime.now()
        total_days = (deadline - now).days
        days_per_phase = max(1, total_days // total_phases)
        
        # Set phase deadlines
        current_deadline = now
        for i, phase in enumerate(phases):
            # Last phase gets the project deadline
            if i == total_phases - 1:
                phase_deadline = deadline
            else:
                # Add days for this phase
                current_deadline += timedelta(days=days_per_phase)
                phase_deadline = current_deadline
            
            # Update phase history with deadline
            phase_history = History.objects.get(id=phase.history_id)
            phase_history.deadline = phase_deadline
            phase_history.save()
            
            # Calculate output deadlines within this phase
            set_phase_timeline(phase.id, phase_deadline)
    
    return True

def set_phase_timeline(phase_id, deadline):
    """
    Set phase timeline with deadline and calculate output deadlines
    """
    phase = Phase.objects.get(id=phase_id)
    
    # Update history record with deadline
    history = History.objects.get(id=phase.history_id)
    history.deadline = deadline
    history.save()
    
    # Calculate output deadlines
    outputs = Output.objects.filter(phase=phase)
    total_outputs = outputs.count()
    
    if total_outputs > 0:
        # Calculate time per output
        now = datetime.now()
        total_days = (deadline - now).days
        days_per_output = max(1, total_days // total_outputs)
        
        # Set output deadlines
        current_deadline = now
        for i, output in enumerate(outputs):
            # Last output gets the phase deadline
            if i == total_outputs - 1:
                output_deadline = deadline
            else:
                # Add days for this output
                current_deadline += timedelta(days=days_per_output)
                output_deadline = current_deadline
            
            # Update output history with deadline
            output_history = History.objects.get(id=output.history_id)
            output_history.deadline = output_deadline
            output_history.save()
    
    return True

def update_timeline_progress(entity_type, entity_id, status):
    """
    Update timeline progress based on status changes
    """
    now = datetime.now()
    
    if entity_type == 'project':
        project = Project.objects.get(id=entity_id)
        history = History.objects.get(id=project.history_id)
        
        if status == 'In Progress' and not history.started_at:
            history.started_at = now
        elif status in ['Completed', 'Archived']:
            history.finished_at = now
        
        history.save()
    
    elif entity_type == 'ppap':
        ppap = PPAP.objects.get(id=entity_id)
        history = History.objects.get(id=ppap.history_id)
        
        if status == 'In Progress' and not history.started_at:
            history.started_at = now
        elif status in ['Completed', 'Approved']:
            history.finished_at = now
        
        history.save()
    
    elif entity_type == 'phase':
        phase = Phase.objects.get(id=entity_id)
        history = History.objects.get(id=phase.history_id)
        
        if status == 'In Progress' and not history.started_at:
            history.started_at = now
        elif status in ['Completed', 'Approved']:
            history.finished_at = now
        
        history.save()
    
    elif entity_type == 'output':
        output = Output.objects.get(id=entity_id)
        history = History.objects.get(id=output.history_id)
        
        if status == 'In Progress' and not history.started_at:
            history.started_at = now
        elif status in ['Completed', 'Approved']:
            history.finished_at = now
        
        history.save()
    
    return True

def get_timeline_overview(project_id):
    """
    Get timeline overview for a project
    """
    project = Project.objects.get(id=project_id)
    ppap = project.ppap
    
    # Get project timeline
    project_history = History.objects.get(id=project.history_id)
    project_timeline = {
        'started_at': project_history.started_at,
        'deadline': project_history.deadline,
        'finished_at': project_history.finished_at,
        'status': project.status
    }
    
    # Get phase timelines
    phases = Phase.objects.filter(ppap=ppap).order_by('template__order')
    phase_timelines = []
    
    for phase in phases:
        phase_history = History.objects.get(id=phase.history_id)
        phase_timelines.append({
            'id': phase.id,
            'name': phase.template.name,
            'started_at': phase_history.started_at,
            'deadline': phase_history.deadline,
            'finished_at': phase_history.finished_at,
            'status': phase.status
        })
    
    # Get output timelines
    output_timelines = []
    for phase in phases:
        outputs = Output.objects.filter(phase=phase)
        for output in outputs:
            output_history = History.objects.get(id=output.history_id)
            output_timelines.append({
                'id': output.id,
                'name': output.template.name,
                'phase_id': phase.id,
                'phase_name': phase.template.name,
                'started_at': output_history.started_at,
                'deadline': output_history.deadline,
                'finished_at': output_history.finished_at,
                'status': output.status
            })
    
    return {
        'project': project_timeline,
        'phases': phase_timelines,
        'outputs': output_timelines
    }
