# Define all API here
from core.services.project.initialization import initialize_project, initialize_fastquery
from core.services.project.functions import (
    update_project,
    delete_project,
    archive_project,
    get_project_details
)

# Export all functions for use in views
__all__ = [
    'initialize_project',
    'initialize_fastquery',
    'update_project',
    'delete_project',
    'archive_project',
    'get_project_details'
]
