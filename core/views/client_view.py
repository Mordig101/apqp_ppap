from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction
from core.models import Client, Contact, Project, Team
from core.serializers.client_serializer import ClientSerializer
from core.serializers.project_serializer import ProjectSerializer
from core.services.client.api import (
    initialize_client,
    update_client,
    delete_client,
    get_client_projects
)
from core.services.history.client import record_client_creation, record_client_update, record_client_deletion

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        # Extract client data
        name = request.data.get('name')
        address = request.data.get('address', '')
        code = request.data.get('code', {})
        description = request.data.get('description', '')
        team_id = request.data.get('team_id')
        contact_data = request.data.get('contact', {})
        
        # Validate required fields
        if not name:
            return Response(
                {"error": "Missing required field: name"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Get team if provided
            team = None
            if team_id:
                try:
                    team = Team.objects.get(id=team_id)
                except Team.DoesNotExist:
                    return Response(
                        {"error": f"Team with ID {team_id} not found"},
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            # Create client in a single save operation to avoid ID conflicts
            client = Client()
            client.name = name
            client.address = address
            client.code = code
            client.description = description
            client.team = team
            # Don't set contact_id or history_id - let the model's save method handle it
            client.save()
            
            # Create contact 
            Contact.objects.create(
                id=client.contact_id,
                address=contact_data.get('address', '') or address,
                email=contact_data.get('email', ''),
                phone=contact_data.get('phone', ''),
                type='client'
            )
            
            # Record in history
            record_client_creation(client)
            
            serializer = self.get_serializer(client)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @transaction.atomic
    def update(self, request, *args, **kwargs):
        client = self.get_object()
        
        # Extract client data
        name = request.data.get('name')
        address = request.data.get('address')
        code = request.data.get('code')
        description = request.data.get('description')
        
        try:
            # Update client
            updated_client = update_client(
                client=client,
                name=name,
                address=address,
                code=code,
                description=description
            )
            
            # Record in history
            
            serializer = self.get_serializer(updated_client)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        client = self.get_object()
        
        try:
            # Delete client
            delete_client(client)
            
            # Record in history
            record_client_deletion(client)
            
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['get'])
    def projects(self, request, pk=None):
        try:
            projects = get_client_projects(pk)
            serializer = ProjectSerializer(projects, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
