from django.urls import path, include
from rest_framework.routers import DefaultRouter
from core.views import (
    ProjectViewSet, PPAPViewSet, PhaseViewSet, OutputViewSet,
    DocumentViewSet, UserViewSet, ClientViewSet, TeamViewSet,
    HistoryViewSet
)
from core.views.department_view import DepartmentViewSet
from core.views.api_view import (
    dashboard_view,
    user_permissions_view,
    change_status_view,
    assign_permission_view,
    assign_phase_responsible_view
)
from core.views.timeline_view import (
    set_project_timeline_view,
    set_phase_timeline_view,
    get_timeline_overview_view
)

router = DefaultRouter()
router.register(r'projects', ProjectViewSet)
router.register(r'ppaps', PPAPViewSet)
router.register(r'phases', PhaseViewSet)
router.register(r'outputs', OutputViewSet)
router.register(r'documents', DocumentViewSet)
router.register(r'users', UserViewSet)
router.register(r'clients', ClientViewSet)
router.register(r'teams', TeamViewSet)
router.register(r'history', HistoryViewSet)
router.register(r'departments', DepartmentViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('api/dashboard/', dashboard_view, name='dashboard'),
    path('api/user-permissions/', user_permissions_view, name='user-permissions'),
    path('api/change-status/', change_status_view, name='change-status'),
    path('api/assign-permission/', assign_permission_view, name='assign-permission'),
    path('api/assign-phase-responsible/', assign_phase_responsible_view, name='assign-phase-responsible'),
    path('api/set-project-timeline/', set_project_timeline_view, name='set-project-timeline'),
    path('api/set-phase-timeline/', set_phase_timeline_view, name='set-phase-timeline'),
    path('api/timeline/<int:project_id>/', get_timeline_overview_view, name='get-timeline-overview'),
]
