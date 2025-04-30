# Define all API here
from core.services.logic.level import (
    filter_outputs_by_level,
    get_visible_outputs_for_user,
    get_dashboard_items_by_level
)
from core.services.logic.permission import (
    assign_permission,
    check_permission,
    get_user_permissions
)
from core.services.logic.status import (
    change_project_status,
    change_ppap_status,
    change_phase_status,
    change_output_status
)
from core.services.logic.todo import (
    create_todo,
    assign_todos_for_phase,
    get_user_todos,
    get_pending_todos
)
from core.services.logic.authorization import (
    check_user_authorization,
    check_output_permission,
    get_user_authorization_details
)

# Export all functions for use in views
__all__ = [
    'filter_outputs_by_level',
    'get_visible_outputs_for_user',
    'get_dashboard_items_by_level',
    'assign_permission',
    'check_permission',
    'get_user_permissions',
    'change_project_status',
    'change_ppap_status',
    'change_phase_status',
    'change_output_status',
    'create_todo',
    'assign_todos_for_phase',
    'get_user_todos',
    'get_pending_todos',
    'check_user_authorization',
    'check_output_permission',
    'get_user_authorization_details'
]
