# Define all API here
from core.services.phase.initialization import initialize_phases
from core.services.phase.functions import (
    update_phase,
    update_ppap_status_from_phase,
    get_phase_details
)

# Export all functions for use in views
__all__ = [
    'initialize_phases',
    'update_phase',
    'update_ppap_status_from_phase',
    'get_phase_details'
]
