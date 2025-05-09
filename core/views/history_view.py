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

# At the top of history_view.py

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
    Get nested history for all projects
    """
    # Immediate test response to confirm function is being called
    if request.query_params.get('test') == 'true':
        return Response({"status": "success", "test": True}, status=status.HTTP_200_OK)
    
    try:
        # Get pagination parameters with safe defaults
        try:
            page = max(int(request.query_params.get('page', '1')), 1)
            page_size = max(min(int(request.query_params.get('page_size', '10')), 100), 1)
        except ValueError:
            page = 1
            page_size = 10
            
        print(f"Requested page {page}, size {page_size}")
        
        # Basic sanity check - verify Project model is accessible
        try:
            project_count = Project.objects.count()
            print(f"Found {project_count} total projects")
        except Exception as e:
            print(f"Error accessing Project model: {e}")
            return Response(
                {"error": f"Database error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
        # Get all projects with pagination
        all_projects = Project.objects.all().order_by('-id')
        total_count = all_projects.count()
        
        # Apply pagination
        start = (page - 1) * page_size
        end = start + page_size
        
        # Make sure we don't go out of bounds
        if start >= total_count:
            # If page is too high, return empty result set
            return Response({
                "total": total_count,
                "page": page,
                "page_size": page_size,
                "pages": (total_count + page_size - 1) // page_size if page_size > 0 else 0,
                "results": {}
            }, status=status.HTTP_200_OK)
        
        # Get the paginated subset of projects
        paginated_projects = all_projects[start:end]
        print(f"Processing {len(paginated_projects)} projects for page {page}")
        
        # Extract project IDs and names safely
        project_data = {}
        for project in paginated_projects:
            try:
                project_data[project.id] = {
                    "id": project.id,
                    "name": project.name if hasattr(project, 'name') else f"Project {project.id}"
                }
            except Exception as e:
                print(f"Error extracting data from project {getattr(project, 'id', 'unknown')}: {e}")
                continue
        
        # Process projects one by one
        all_nested_history = {}
        for project_id, data in project_data.items():
            print(f"Processing project {project_id} ({data['name']})")
            
            try:
                # Call the nested history function
                project_nested_history = get_nested_project_history(project_id)
                
                # Check if there was an error
                if isinstance(project_nested_history, dict) and "error" in project_nested_history:
                    print(f"Error for project {project_id}: {project_nested_history['error']}")
                    continue
                
                # Store the result
                all_nested_history[project_id] = {
                    "project_name": data['name'],
                    "history": project_nested_history
                }
                print(f"Successfully processed project {project_id}")
                
            except Exception as e:
                print(f"Exception while processing project {project_id}: {str(e)}")
                import traceback
                traceback.print_exc()
                continue
        
        # Construct the final response
        response = {
            "total": total_count,
            "page": page,
            "page_size": page_size,
            "pages": (total_count + page_size - 1) // page_size if page_size > 0 else 0,
            "results": all_nested_history
        }
        
        print(f"Returning results with {len(all_nested_history)} projects processed")
        return Response(response, status=status.HTTP_200_OK)
        
    except Exception as e:
        # Catch any unforeseen exceptions
        print(f"Unexpected error in get_all_projects_nested_history: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": f"Internal server error: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def simple_test_view(request):
    """Simple test view to confirm routing works"""
    return Response({"message": "Simple test view works"}, status=status.HTTP_200_OK)
