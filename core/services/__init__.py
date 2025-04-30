# Services module
from core.services.history import api as history_api
from core.services.project import api as project_api
from core.services.ppap import api as ppap_api
from core.services.phase import api as phase_api
from core.services.output import api as output_api
from core.services.document import api as document_api
from core.services.timeline import api as timeline_api
from core.services.logic import api as logic_api

# Export all APIs for use in views
__all__ = [
    'history_api',
    'project_api',
    'ppap_api',
    'phase_api',
    'output_api',
    'document_api',
    'timeline_api',
    'logic_api'
]
