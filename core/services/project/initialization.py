import uuid
from django.db import transaction
from core.models import Project, PPAP, FastQuery
from core.services.history.initialization import initialize_history
from core.services.ppap.initialization import initialize_ppap

@transaction.atomic
def initialize_project(name, description, client_id, team_id, ppap_level=3):
    """
    Initialize a new project with all related records
    """
    # Generate history ID
    history_id = f"{uuid.uuid4().hex}project"
    
    # Create project record
    project = Project.objects.create(
        name=name,
        description=description,
        client_id=client_id,
        team_id=team_id,
        status='Planning',
        history_id=history_id
    )
    
    # Initialize history record
    initialize_history(
        title=name,
        event=f"Project created with ID {project.id}",
        table_name='project',
        history_id=history_id
    )
    
    # Initialize PPAP
    ppap = initialize_ppap(project.id, ppap_level)
    
    # Update project with PPAP ID
    project.ppap = ppap
    project.save()
    
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
