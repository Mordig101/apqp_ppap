from django.urls import path, include
from rest_framework.routers import DefaultRouter
from core.views import (
    project_view, ppap_view, phase_view, output_view, document_view, 
    user_view, client_view, team_view, history_view, api_view, timeline_view,
    person_view, contact_view, department_view, template_view, todo_view,
    ppap_element_view, authorization_view ,auth_api
)
from core.views.history_view import (
    get_nested_history,
    get_all_projects_nested_history,
    simple_test_view
)

# Set up the REST API router
router = DefaultRouter()
router.register(r'projects', project_view.ProjectViewSet)
router.register(r'ppaps', ppap_view.PPAPViewSet)
router.register(r'phases', phase_view.PhaseViewSet)
router.register(r'outputs', output_view.OutputViewSet)
router.register(r'documents', document_view.DocumentViewSet)
router.register(r'users', user_view.UserViewSet)
router.register(r'clients', client_view.ClientViewSet)
router.register(r'teams', team_view.TeamViewSet)
router.register(r'history', history_view.HistoryViewSet)
router.register(r'timeline', timeline_view.TimelineViewSet, basename='timeline')
router.register(r'persons', person_view.PersonViewSet)
router.register(r'contacts', contact_view.ContactViewSet)
router.register(r'departments', department_view.DepartmentViewSet)
router.register(r'phase-templates', template_view.PhaseTemplateViewSet)
router.register(r'output-templates', template_view.OutputTemplateViewSet)
router.register(r'todos', todo_view.TodoViewSet)
router.register(r'ppap-elements', ppap_element_view.PPAPElementViewSet)
router.register(r'authorizations', authorization_view.AuthorizationViewSet)

# Get a reference to the ViewSet class
timeline_viewset = timeline_view.TimelineViewSet.as_view({
    'post': 'set_project_timeline'
})
phase_timeline_viewset = timeline_view.TimelineViewSet.as_view({
    'post': 'set_phase_timeline'
})
timeline_overview_viewset = timeline_view.TimelineViewSet.as_view({
    'get': 'overview'
})

# Define URL patterns
urlpatterns = [
    # Include all router URLs
    path('', include(router.urls)),
    
    # API testing endpoint
    path('test/', api_view.test_api, name='test_api'),
    
    # Dashboard view
    path('dashboard/', api_view.dashboard_view, name='dashboard'),
    
    # User permissions
    path('user-permissions/', api_view.user_permissions_view, name='user-permissions'),
    
    # Status changes
    path('change-status/', api_view.change_status_view, name='change-status'),
    
    # Permission assignment
    path('assign-permission/', api_view.assign_permission_view, name='assign-permission'),
    
    # Phase responsibility
    path('assign-phase-responsible/', api_view.assign_phase_responsible_view, name='assign-phase-responsible'),
    
    # Authentication endpoints
    path('auth/login/', auth_api.api_login, name='api_login'),
    path('auth/logout/', auth_api.api_logout, name='api_logout'),
    path('auth/user/', auth_api.api_get_user, name='api_get_user'),

    # Nested history
    path('projects/<int:project_id>/nested-history/', get_nested_history, name='project-nested-history'),
    path('projects/nested-history/', get_all_projects_nested_history, name='all-projects-nested-history'),

    # Simple test
    path('simple-test/', simple_test_view, name='simple-test'),

    # Projects history
    path('projects-history/', include('core.urls_project_history')),
]
