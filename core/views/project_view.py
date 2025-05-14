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
        
        # Extract history attributes
        history_attrs = {}
        if 'history' in request.data and isinstance(request.data['history'], dict):
            history_data = request.data['history']
            if 'title' in history_data:
                history_attrs['title'] = history_data['title']
            if 'deadline' in history_data:
                history_attrs['deadline'] = history_data['deadline']
            if 'started_at' in history_data:
                history_attrs['started_at'] = history_data['started_at']
            if 'finished_at' in history_data:
                history_attrs['finished_at'] = history_data['finished_at']
        
        # Validate required fields
        if not all([name, client_id, team_id]):
            return Response(
                {"error": "Missing required fields: name, client_id, team_id"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Initialize project with all related records
        try:
            project = initialize_project(
                name, 
                description, 
                client_id, 
                team_id, 
                ppap_level,
                history_attrs=history_attrs if history_attrs else None
            )
            serializer = self.get_serializer(project)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
            
    @transaction.atomic
    def update(self, request, *args, **kwargs):
        project = self.get_object()
        
        # Extract history attributes
        history_attrs = {}
        if 'history' in request.data and isinstance(request.data['history'], dict):
            history_data = request.data['history']
            if 'title' in history_data:
                history_attrs['title'] = history_data['title']
            if 'deadline' in history_data:
                history_attrs['deadline'] = history_data['deadline']
            if 'started_at' in history_data:
                history_attrs['started_at'] = history_data['started_at']
            if 'finished_at' in history_data:
                history_attrs['finished_at'] = history_data['finished_at']
        
        try:
            # Update project with provided data
            from core.services.project.functions import update_project
            updated_project = update_project(
                project.id, 
                request.data,
                history_attrs=history_attrs if history_attrs else None
            )
            
            serializer = self.get_serializer(updated_project)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['put'])
    def update_history(self, request, pk=None):
        """Update only history attributes for this project"""
        try:
            # Get history attributes from request
            history_attrs = {}
            if 'title' in request.data:
                history_attrs['title'] = request.data.get('title')
            if 'deadline' in request.data:
                history_attrs['deadline'] = request.data.get('deadline')
            if 'started_at' in request.data:
                history_attrs['started_at'] = request.data.get('started_at')
            if 'finished_at' in request.data:
                history_attrs['finished_at'] = request.data.get('finished_at')
            
            # Update history
            from core.services.project.functions import update_project_history
            history = update_project_history(pk, history_attrs)
            if not history:
                return Response(
                    {'error': 'History record not found for this project'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Return updated history
            from core.serializers.history_serializer import HistorySerializer
            serializer = HistorySerializer(history)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        project = self.get_object()
        history_records = History.objects.filter(id=project.history_id)
        serializer = HistorySerializer(history_records, many=True)
        return Response(serializer.data)
