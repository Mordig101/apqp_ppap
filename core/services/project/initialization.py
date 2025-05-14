import uuid
from django.db import transaction
from core.models import Project, PPAP, FastQuery
from core.services.history.initialization import initialize_history
from core.services.ppap.initialization import initialize_ppap
from core.services.history.project import record_project_creation

@transaction.atomic
def initialize_project(name, description, client_id, team_id, ppap_level=3, history_attrs=None):
    """
    Initialize a new project with all related records
    
    Args:
        name: Project name
        description: Project description
        client_id: Client ID
        team_id: Team ID
        ppap_level: PPAP level (default: 3)
        history_attrs: Dictionary with history attributes (optional)
            - title: Custom history title
            - deadline: Deadline date (ISO format string)
            - started_at: Start date (ISO format string)
            - finished_at: Completion date (ISO format string)
    """
    # Create project record
    project = Project.objects.create(
        name=name,
        description=description,
        client_id=client_id,
        team_id=team_id,
        status='Not Started',
    )
    
    # Record creation in history
    history = record_project_creation(project)
    
    # Update history attributes if provided
    if history and history_attrs and isinstance(history_attrs, dict):
        from core.services.history.initialization import update_history_attributes
        update_history_attributes(
            history, 
            history_attrs, 
            auto_update_related_model=False,
            related_model=project
        )
    
    # Initialize PPAP
    ppap = initialize_ppap(project.id, ppap_level)
    
    # Update project with PPAP ID
    project.ppap = ppap
    project.save(update_fields=['ppap'])
    
    # Initialize FastQuery
    initialize_fastquery(project.id)
    
    return project

def initialize_fastquery(project_id):
    """
    Initialize a FastQuery record for a project
    """
    project = Project.objects.get(id=project_id)
    ppap = project.ppap
    
    # Collect all related IDs
    index = {
        'project_id': project.id,
        'ppap_id': ppap.id,
        'phase_ids': list(ppap.phases.values_list('id', flat=True)),
        'output_ids': []
    }
    
    # Add output IDs
    for phase in ppap.phases.all():
        output_ids = list(phase.outputs.values_list('id', flat=True))
        index['output_ids'].extend(output_ids)
    
    # Create FastQuery record
    fastquery = FastQuery.objects.create(
        project=project,
        index=index
    )
    
    return fastquery
