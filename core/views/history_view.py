from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from core.models import History, Project
from core.serializers.history_serializer import HistorySerializer
from core.services.history.nested_history import get_nested_project_history
import json
from concurrent.futures import ThreadPoolExecutor
import threading

class HistoryViewSet(viewsets.ModelViewSet):
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

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_nested_history(request, project_id):
    """
    Get nested history for a project including all related components
    """
    nested_data = get_nested_project_history(project_id)
    
    if "error" in nested_data:
        return Response({"error": nested_data["error"]}, status=status.HTTP_404_NOT_FOUND)
    
    return Response(nested_data, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_projects_nested_history(request):
    """
    Get nested history for all projects with concurrent processing
    """
    try:
        # Get pagination parameters
        page_size = int(request.query_params.get('page_size', 10))
        page = int(request.query_params.get('page', 1))
        
        # Get all project IDs
        all_projects = Project.objects.all().order_by('-id')
        
        # Apply pagination
        start = (page - 1) * page_size
        end = start + page_size
        paginated_projects = all_projects[start:end]
        project_ids = [project.id for project in paginated_projects]
        project_names = {project.id: project.name for project in paginated_projects}
        
        # Use thread pool to get nested history concurrently
        all_nested_history = {}
        thread_local = threading.local()
        
        def get_project_history(project_id):
            project_nested_history = get_nested_project_history(project_id)
            
            # Skip projects with errors
            if "error" in project_nested_history:
                return None
                
            return {
                "project_id": project_id,
                "project_name": project_names[project_id],
                "history": project_nested_history
            }
        
        # Process projects concurrently with a thread pool
        with ThreadPoolExecutor(max_workers=min(10, len(project_ids))) as executor:
            results = list(executor.map(get_project_history, project_ids))
        
        # Filter out None results and organize by project ID
        for result in filter(None, results):
            all_nested_history[result["project_id"]] = {
                "project_name": result["project_name"],
                "history": result["history"]
            }
        
        # Return with pagination info
        response = {
            "total": all_projects.count(),
            "page": page,
            "page_size": page_size,
            "pages": (all_projects.count() + page_size - 1) // page_size,
            "results": all_nested_history
        }
        
        return Response(response, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {"error": f"Failed to retrieve nested history: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
