# Define all API here
from core.services.history.initialization import initialize_history, generate_history_id
from core.services.history.project import (
    record_project_creation, 
    record_project_update, 
    record_project_deletion
)
from core.services.history.ppap import (
    record_ppap_creation, 
    record_ppap_update, 
    record_ppap_level_change
)
from core.services.history.phase import (
    record_phase_creation, 
    record_phase_update, 
    record_phase_status_change
)
from core.services.history.output import (
    record_output_creation, 
    record_output_update, 
    record_output_status_change,
    record_output_document_upload,
    record_output_responsibility_change,
    record_output_deletion,
    record_output_review,
    get_output_history
)
from core.services.history.user import (
    record_user_creation, 
    record_user_update, 
    record_user_login
)
from core.services.history.document import (
    record_document_creation,
    record_document_update,
    record_document_version_change,
    record_document_status_change,
    record_document_deletion,
    get_document_history
)
from core.services.history.client import (
    record_client_creation,
    record_client_update,
    record_client_deletion,
    get_client_history
)
from core.services.history.team import (
    record_team_creation,
    record_team_update,
    record_team_member_addition,
    record_team_member_removal,
    record_team_deletion,
    get_team_history
)
from core.services.history.department import (
    record_department_creation,
    record_department_update,
    record_department_responsible_change,
    record_department_deletion,
    get_department_history
)
from core.services.history.person import (
    record_person_creation,
    record_person_update,
    record_person_team_change,
    record_person_department_change,
    record_person_deletion,
    get_person_history
)
from core.services.history.contact import (
    record_contact_creation,
    record_contact_update,
    record_contact_deletion,
    get_contact_history
)

# Export all functions for use in views
__all__ = [
    # Initialization
    'initialize_history',
    'generate_history_id',
    
    # Project
    'record_project_creation',
    'record_project_update',
    'record_project_deletion',
    
    # PPAP
    'record_ppap_creation',
    'record_ppap_update',
    'record_ppap_level_change',
    
    # Phase
    'record_phase_creation',
    'record_phase_update',
    'record_phase_status_change',
    
    # Output
    'record_output_creation',
    'record_output_update',
    'record_output_status_change',
    'record_output_document_upload',
    'record_output_responsibility_change',
    'record_output_deletion',
    'record_output_review',
    'get_output_history',
    
    # User
    'record_user_creation',
    'record_user_update',
    'record_user_login',
    
    # Document
    'record_document_creation',
    'record_document_update',
    'record_document_version_change',
    'record_document_status_change',
    'record_document_deletion',
    'get_document_history',
    
    # Client
    'record_client_creation',
    'record_client_update',
    'record_client_deletion',
    'get_client_history',
    
    # Team
    'record_team_creation',
    'record_team_update',
    'record_team_member_addition',
    'record_team_member_removal',
    'record_team_deletion',
    'get_team_history',
    
    # Department
    'record_department_creation',
    'record_department_update',
    'record_department_responsible_change',
    'record_department_deletion',
    'get_department_history',
    
    # Person
    'record_person_creation',
    'record_person_update',
    'record_person_team_change',
    'record_person_department_change',
    'record_person_deletion',
    'get_person_history',
    
    # Contact
    'record_contact_creation',
    'record_contact_update',
    'record_contact_deletion',
    'get_contact_history'
]
