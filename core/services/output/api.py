# Define all API here
import uuid
from core.services.output.initialization import initialize_outputs
from core.services.output.functions import (
    create_output,
    update_output,
    update_output_history,
    update_phase_status_from_output,
    add_document_to_output,
    get_output_details
)

# Export all functions for use in views
__all__ = [
    'initialize_outputs',
    'create_output',
    'update_output',
    'update_output_history',
    'update_phase_status_from_output',
    'add_document_to_output',
    'get_output_details'
]
