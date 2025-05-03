from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from core.models import History, Project
from core.serializers.history_serializer import HistorySerializer
import json

class HistoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = History.objects.all()
    serializer_class = HistorySerializer
    
    @action(detail=True, methods=['get'])
    def events(self, request, pk=None):
        """Get all events for a specific history record"""
        history = self.get_object()
        
        try:
            events = json.loads(history.event)
            return Response(events)
        except (json.JSONDecodeError, TypeError):
            return Response([{
                "type": "unknown",
                "details": history.event or "No details available",
                "timestamp": history.created_at.isoformat() if history.created_at else None
            }])
    
    @action(detail=False, methods=['get'])
    def project(self, request, project_id=None):
        project_id = request.query_params.get('project_id')
        if not project_id:
            return Response(
                {"error": "Missing required parameter: project_id"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            project = Project.objects.get(id=project_id)
            history_records = History.objects.filter(id=project.history_id)
            
            # Get related history records
            if project.ppap:
                ppap_history = History.objects.filter(id=project.ppap.history_id)
                history_records = history_records.union(ppap_history)
                
                # Get phase history
                for phase in project.ppap.phases.all():
                    phase_history = History.objects.filter(id=phase.history_id)
                    history_records = history_records.union(phase_history)
                    
                    # Get output history
                    for output in phase.outputs.all():
                        output_history = History.objects.filter(id=output.history_id)
                        history_records = history_records.union(output_history)
            
            serializer = self.get_serializer(history_records, many=True)
            return Response(serializer.data)
        except Project.DoesNotExist:
            return Response(
                {"error": f"Project with ID {project_id} not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
