# Define all API here
from core.services.ppap.initialization import initialize_ppap
from core.services.ppap.functions import (
    update_ppap,
    update_outputs_for_level_change,
    get_ppap_details
)

# Export all functions for use in views
__all__ = [
    'initialize_ppap',
    'update_ppap',
    'update_outputs_for_level_change',
    'get_ppap_details'
]
