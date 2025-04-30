from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from core.services import timeline_api, logic_api

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_project_timeline_view(request):
    """
    Set project timeline with deadline
    """
    user = request.user
    project_id = request.data.get('project_id')
    deadline_str = request.data.get('deadline')
    
    if not all([project_id, deadline_str]):
        return Response(
            {"error": "Missing required fields: project_id, deadline"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Parse deadline
        from datetime import datetime
        deadline = datetime.fromisoformat(deadline_str.replace('Z', '+00:00'))
        
        # Check authorization
        if not logic_api.check_user_authorization(user.id, 'update', 'project', project_id):
            return Response(
                {"error": "Not authorized to set project timeline"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Set project timeline
        timeline_api.set_project_timeline(project_id, deadline)
        
        return Response({
            "success": True,
            "message": f"Project timeline set with deadline {deadline_str}"
        })
    except ValueError as e:
        return Response(
            {"error": f"Invalid deadline format: {str(e)}"},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_phase_timeline_view(request):
    """
    Set phase timeline with deadline
    """
    user = request.user
    phase_id = request.data.get('phase_id')
    deadline_str = request.data.get('deadline')
    
    if not all([phase_id, deadline_str]):
        return Response(
            {"error": "Missing required fields: phase_id, deadline"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Parse deadline
        from datetime import datetime
        deadline = datetime.fromisoformat(deadline_str.replace('Z', '+00:00'))
        
        # Check authorization
        if not logic_api.check_user_authorization(user.id, 'update', 'phase', phase_id):
            return Response(
                {"error": "Not authorized to set phase timeline"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Set phase timeline
        timeline_api.set_phase_timeline(phase_id, deadline)
        
        return Response({
            "success": True,
            "message": f"Phase timeline set with deadline {deadline_str}"
        })
    except ValueError as e:
        return Response(
            {"error": f"Invalid deadline format: {str(e)}"},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_timeline_overview_view(request, project_id):
    """
    Get timeline overview for a project
    """
    user = request.user
    
    try:
        # Check authorization
        if not logic_api.check_user_authorization(user.id, 'read', 'project', project_id):
            return Response(
                {"error": "Not authorized to view project timeline"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get timeline overview
        timeline = timeline_api.get_timeline_overview(project_id)
        
        return Response(timeline)
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
