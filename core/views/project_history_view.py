from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from core.models import Project
from core.services.history.nested_history import get_nested_project_history

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def all_projects_history(request):
    """Get history data for all projects"""
    try:
        # Get pagination parameters
        try:
            page = max(int(request.query_params.get('page', '1')), 1)
            page_size = max(min(int(request.query_params.get('page_size', '10')), 50), 1)
        except (ValueError, TypeError):
            page = 1
            page_size = 10
        
        # Verify we can access the Project model
        project_count = Project.objects.count()
        
        # Get paginated projects
        all_projects = Project.objects.all().order_by('-id')
        total = all_projects.count()
        
        start_index = (page - 1) * page_size
        end_index = min(start_index + page_size, total)
        
        paginated_projects = all_projects[start_index:end_index]
        
        # Process each project
        results = {}
        for project in paginated_projects:
            try:
                project_history = get_nested_project_history(project.id)
                
                if isinstance(project_history, dict) and "error" in project_history:
                    print(f"Error for project {project.id}: {project_history['error']}")
                    continue
                
                project_name = project.name if hasattr(project, 'name') else f"Project {project.id}"
                results[str(project.id)] = {
                    "project_name": project_name,
                    "history": project_history
                }
            except Exception as e:
                print(f"Error processing project {project.id}: {e}")
                continue
        
        # Return paginated response
        return Response({
            "total": total,
            "page": page,
            "page_size": page_size,
            "pages": (total + page_size - 1) // page_size,
            "results": results
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({"error": f"Failed to retrieve projects history: {str(e)}"}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)