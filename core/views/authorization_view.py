from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.db import transaction

from core.models import Authorization
from core.serializers.authorization_serializer import AuthorizationSerializer
from core.services.authorization.api import (
    get_authorization_by_id,
    get_authorization_by_name,
    create_authorization,
    update_authorization,
    delete_authorization,
    get_all_authorizations,
    assign_user_authorization
)
from core.services.logic.authorization import check_user_authorization

class AuthorizationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Authorization
    """
    queryset = Authorization.objects.all()
    serializer_class = AuthorizationSerializer
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        """
        Get all authorizations
        """
        user = request.user
        
        # Check authorization
        if not check_user_authorization(user.id, 'read', 'authorization'):
            return Response(
                {"error": "Not authorized to view authorizations"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        authorizations = get_all_authorizations()
        serializer = self.get_serializer(authorizations, many=True)
        return Response(serializer.data)
    
    def retrieve(self, request, pk=None):
        """
        Get authorization details
        """
        user = request.user
        
        # Check authorization
        if not check_user_authorization(user.id, 'read', 'authorization'):
            return Response(
                {"error": "Not authorized to view authorization details"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            authorization = get_authorization_by_id(pk)
            serializer = self.get_serializer(authorization)
            return Response(serializer.data)
        except Authorization.DoesNotExist:
            return Response(
                {"error": f"Authorization with ID {pk} not found"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def create(self, request):
        """
        Create a new authorization
        """
        user = request.user
        
        # Check authorization
        if not check_user_authorization(user.id, 'create', 'authorization'):
            return Response(
                {"error": "Not authorized to create authorizations"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        name = request.data.get('name')
        
        if not name:
            return Response(
                {"error": "Name is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            authorization = create_authorization(name)
            serializer = self.get_serializer(authorization)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def update(self, request, pk=None):
        """
        Update an authorization
        """
        user = request.user
        
        # Check authorization
        if not check_user_authorization(user.id, 'update', 'authorization'):
            return Response(
                {"error": "Not authorized to update authorizations"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        name = request.data.get('name')
        
        try:
            authorization = update_authorization(pk, name)
            serializer = self.get_serializer(authorization)
            return Response(serializer.data)
        except Authorization.DoesNotExist:
            return Response(
                {"error": f"Authorization with ID {pk} not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def destroy(self, request, pk=None):
        """
        Delete an authorization
        """
        user = request.user
        
        # Check authorization
        if not check_user_authorization(user.id, 'delete', 'authorization'):
            return Response(
                {"error": "Not authorized to delete authorizations"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            result = delete_authorization(pk)
            
            if result:
                return Response(status=status.HTTP_204_NO_CONTENT)
            else:
                return Response(
                    {"error": "Cannot delete authorization that is in use"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Authorization.DoesNotExist:
            return Response(
                {"error": f"Authorization with ID {pk} not found"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['post'])
    @transaction.atomic
    def assign(self, request):
        """
        Assign authorization to a user
        """
        user = request.user
        user_id = request.data.get('user_id')
        authorization_id = request.data.get('authorization_id')
        
        if not all([user_id, authorization_id]):
            return Response(
                {"error": "Missing required fields: user_id, authorization_id"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check authorization
        if not check_user_authorization(user.id, 'update', 'user', user_id):
            return Response(
                {"error": "Not authorized to update user's authorization"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            updated_user = assign_user_authorization(user_id, authorization_id)
            
            return Response({
                "success": True,
                "message": f"Authorization {authorization_id} assigned to user {user_id}",
                "user_id": updated_user.id,
                "authorization_id": authorization_id
            })
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )