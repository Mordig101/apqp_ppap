from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from core.services import (
    history_api,
    project_api,
    ppap_api,
    phase_api,
    output_api,
    logic_api
)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_view(request):
    """
    Get dashboard data for the current user
    """
    user = request.user
    ppap_level = request.query_params.get('level')
    
    if ppap_level:
        try:
            ppap_level = int(ppap_level)
        except ValueError:
            return Response(
                {"error": "Invalid PPAP level"},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    # Get dashboard items filtered by level
    dashboard_items = logic_api.get_dashboard_items_by_level(user, ppap_level)
    
    # Get pending todos for the user
    pending_todos = logic_api.get_pending_todos(user.id)
    
    return Response({
        'projects': dashboard_items,
        'todos': pending_todos
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_permissions_view(request):
    """
    Get permissions for the current user
    """
    user = request.user
    
    # Get user permissions
    permissions = logic_api.get_user_permissions(user.id)
    
    # Get user authorization details
    authorization_details = logic_api.get_user_authorization_details(user.id)
    
    return Response({
        'permissions': permissions,
        'authorization': authorization_details
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_status_view(request):
    """
    Change status of an entity
    """
    user = request.user
    entity_type = request.data.get('entity_type')
    entity_id = request.data.get('entity_id')
    new_status = request.data.get('status')
    
    if not all([entity_type, entity_id, new_status]):
        return Response(
            {"error": "Missing required fields: entity_type, entity_id, status"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Check authorization
        if not logic_api.check_user_authorization(user.id, 'update', entity_type, entity_id):
            return Response(
                {"error": "Not authorized to change status"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Change status based on entity type
        if entity_type == 'project':
            result = logic_api.change_project_status(entity_id, new_status, user.id)
        elif entity_type == 'ppap':
            result = logic_api.change_ppap_status(entity_id, new_status, user.id)
        elif entity_type == 'phase':
            result = logic_api.change_phase_status(entity_id, new_status, user.id)
        elif entity_type == 'output':
            result = logic_api.change_output_status(entity_id, new_status, user.id)
        else:
            return Response(
                {"error": f"Invalid entity type: {entity_type}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response({
            "success": True,
            "message": f"{entity_type} status changed to {new_status}"
        })
    except ValueError as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def assign_permission_view(request):
    """
    Assign permission to a user for an output
    """
    user = request.user
    target_user_id = request.data.get('user_id')
    output_id = request.data.get('output_id')
    permission_type = request.data.get('permission_type')
    
    if not all([target_user_id, output_id, permission_type]):
        return Response(
            {"error": "Missing required fields: user_id, output_id, permission_type"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Check authorization
        if not logic_api.check_user_authorization(user.id, 'update', 'output', output_id):
            return Response(
                {"error": "Not authorized to assign permissions"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Assign permission
        todo = logic_api.assign_permission(target_user_id, output_id, permission_type)
        
        return Response({
            "success": True,
            "message": f"Permission {permission_type} assigned to user {target_user_id} for output {output_id}"
        })
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def assign_phase_responsible_view(request):
    """
    Assign a responsible user to a phase and create todos
    """
    user = request.user
    phase_id = request.data.get('phase_id')
    responsible_id = request.data.get('responsible_id')
    
    if not all([phase_id, responsible_id]):
        return Response(
            {"error": "Missing required fields: phase_id, responsible_id"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Check authorization
        if not logic_api.check_user_authorization(user.id, 'update', 'phase', phase_id):
            return Response(
                {"error": "Not authorized to assign phase responsible"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Assign todos for phase
        todos = logic_api.assign_todos_for_phase(phase_id, responsible_id)
        
        return Response({
            "success": True,
            "message": f"Responsible user {responsible_id} assigned to phase {phase_id} with {len(todos)} todos"
        })
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
