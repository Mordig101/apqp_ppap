# Client service API
from core.services.client.initialization import initialize_client
from core.services.client.functions import (
    get_client_by_id,
    get_clients_by_name,
    get_clients_by_code,
    update_client,
    delete_client,
    get_client_projects
)

# Export all functions for use in views
__all__ = [
    # Initialization
    'initialize_client',
    
    # Functions
    'get_client_by_id',
    'get_clients_by_name',
    'get_clients_by_code',
    'update_client',
    'delete_client',
    'get_client_projects'
]
