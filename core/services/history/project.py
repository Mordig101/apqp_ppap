# Project history tracking
from core.models import History, Project
from core.services.history.initialization import initialize_history

def record_project_creation(project):
    """
    Record project creation in history
    """
    initialize_history(
        title=project.name,
        event=f"Project created with ID {project.id}",
        table_name='project',
        history_id=project.history_id
    )

def record_project_update(project, updated_fields):
    """
    Record project update in history
    """
    initialize_history(
        title=project.name,
        event=f"Project updated: {', '.join(updated_fields)}",
        table_name='project',
        history_id=project.history_id
    )

def record_project_deletion(project):
    """
    Record project deletion in history
    """
    initialize_history(
        title=project.name,
        event=f"Project deleted with ID {project.id}",
        table_name='project',
        history_id=project.history_id
    )
