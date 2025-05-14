# Define project possible action and services
from django.db import transaction
from core.models import Project, PPAP, Phase, Output, Document, History
from core.services.history.api import (
    record_project_update,
    record_project_deletion
)

@transaction.atomic
def update_project(project_id, data, history_attrs=None):
    """
    Update project details
    
    Args:
        project_id: Project ID
        data: Dictionary with project fields to update
        history_attrs: Dictionary with history attributes (optional)
            - title: Custom history title
            - deadline: Deadline date (ISO format string)
            - started_at: Start date (ISO format string)
            - finished_at: Completion date (ISO format string)
    """
    project = Project.objects.get(id=project_id)
    
    # Update fields
    updated_fields = []
    for field, value in data.items():
        if hasattr(project, field) and getattr(project, field) != value:
            # Special handling for name changes
            if field == 'name' and project.name != value:
                old_name = project.name
                project.name = value
                from core.services.history.project import record_project_name_change
                record_project_name_change(project, old_name, value)
            # Special handling for status changes
            elif field == 'status' and project.status != value:
                old_status = project.status
                project.status = value
                from core.services.history.project import record_project_status_change
                record_project_status_change(project, old_status, value)
            else:
                setattr(project, field, value)
            
            updated_fields.append(field)
    
    if updated_fields:
        project.save(update_fields=updated_fields)
        from core.services.history.project import record_project_update
        record_project_update(project, updated_fields)
    
    # Update history attributes if provided
    if history_attrs and isinstance(history_attrs, dict):
        from core.services.history.initialization import update_history_attributes
        from core.services.history.project import get_project_history
        history = get_project_history(project_id)
        if history:
            update_history_attributes(
                history, 
                history_attrs, 
                auto_update_related_model=False,
                related_model=project
            )
    
    return project

@transaction.atomic
def delete_project(project_id):
    """
    Delete a project and all related records
    """
    project = Project.objects.get(id=project_id)
    
    # Record deletion in history
    record_project_deletion(project)
    
    # Delete project (will cascade to related records)
    project.delete()
    
    return True

@transaction.atomic
def archive_project(project_id):
    """
    Archive a project instead of deleting it
    """
    project = Project.objects.get(id=project_id)
    project.status = 'Archived'
    project.save()
    
    record_project_update(project, ['status'])
    
    return project

@transaction.atomic
def update_project_history(project_id, history_attrs):
    """
    Update history attributes for a project
    
    Args:
        project_id: Project ID
        history_attrs: Dictionary with history attributes
            - title: Custom history title
            - deadline: Deadline date (ISO format string)
            - started_at: Start date (ISO format string)
            - finished_at: Completion date (ISO format string)
    
    Returns:
        History: Updated history record or None if not found
    """
    from core.models import Project
    from core.services.history.project import get_project_history
    from core.services.history.initialization import update_history_attributes
    
    # Get project
    project = Project.objects.get(id=project_id)
    
    # Get history record
    history = get_project_history(project_id)
    
    if not history:
        return None
    
    # Update history attributes
    updated_history, _ = update_history_attributes(
        history=history,
        attributes=history_attrs,
        auto_update_related_model=False,
        related_model=project
    )
    
    return updated_history

def get_project_details(project_id):
    """
    Get comprehensive project details including all related records
    """
    project = Project.objects.get(id=project_id)
    
    # Get PPAP details
    ppap = project.ppap
    
    # Get phases
    phases = []
    if ppap:
        phases = ppap.phases.all().order_by('template__order')
    
    # Get outputs for each phase
    phase_details = []
    for phase in phases:
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
        
        phase_details.append({
            'id': phase.id,
            'name': phase.template.name,
            'status': phase.status,
            'responsible': phase.responsible.username if phase.responsible else None,
            'outputs': output_details
        })
    
    # Get history records
    history_records = History.objects.filter(id=project.history_id)
    
    # Compile project details
    project_details = {
        'id': project.id,
        'name': project.name,
        'description': project.description,
        'status': project.status,
        'client': {
            'id': project.client.id,
            'name': project.client.name
        },
        'team': {
            'id': project.team.id,
            'name': project.team.name
        },
        'ppap': {
            'id': ppap.id,
            'level': ppap.level,
            'status': ppap.status,
            'review': ppap.review
        } if ppap else None,
        'phases': phase_details,
        'history': [
            {
                'event': record.event,
                'created_at': record.created_at
            } for record in history_records
        ]
    }
    
    return project_details
