from django.urls import path
from core.views.project_history_view import all_projects_history

urlpatterns = [
    path('all-projects-history/', all_projects_history, name='all-projects-history'),
]