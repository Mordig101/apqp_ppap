from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from core.models import Project, History
from core.serializers.project_serializer import ProjectSerializer
from core.serializers.history_serializer import HistorySerializer
from core.services.project.initialization import initialize_project

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        # Extract data for project initialization
        name = request.data.get('name')
        description = request.data.get('description', '')
        client_id = request.data.get('client_id')
        team_id = request.data.get('team_id')
        ppap_level = request.data.get('ppap_level', 3)
        
        # Validate required fields
        if not all([name, client_id, team_id]):
            return Response(
                {"error": "Missing required fields: name, client_id, team_id"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Initialize project with all related records
        try:
            project = initialize_project(name, description, client_id, team_id, ppap_level)
            serializer = self.get_serializer(project)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
            
    
    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        project = self.get_object()
        history_records = History.objects.filter(id=project.history_id)
        serializer = HistorySerializer(history_records, many=True)
        return Response(serializer.data)
