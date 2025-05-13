# Define all API here
from core.services.phase.initialization import initialize_phases
from core.services.phase.functions import (
    update_phase,
    update_ppap_status_from_phase,
    get_phase_details,
    create_phase,             # New function
    update_phase_history      # New function
)

# Export all functions for use in views
__all__ = [
    'initialize_phases',
    'create_phase',           # Added
    'update_phase',
    'update_phase_history',   # Added
    'update_ppap_status_from_phase',
    'get_phase_details'
]
