from rest_framework import viewsets, status
from rest_framework.response import Response
from django.db import transaction
from core.models import Client, Contact, Project
from core.serializers.client_serializer import ClientSerializer
from core.services.history.initialization import initialize_history
from core.services.history.client import record_client_update, record_client_deletion

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        # Extract client data
        name = request.data.get('name')
        address = request.data.get('address')
        code = request.data.get('code', {})
        description = request.data.get('description', '')
        team_id = request.data.get('team')
        contact_data = request.data.get('contact', {})
        
        # Validate required fields
        if not all([name, address]):
            return Response(
                {"error": "Missing required fields: name, address"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Create client
            client = Client.objects.create(
                name=name,
                address=address,
                code=code,
                description=description,
                team_id=team_id
            )
            
            # Create contact
            contact = Contact.objects.create(
                id=client.contact_id,
                address=contact_data.get('address', address),
                email=contact_data.get('email', ''),
                phone=contact_data.get('phone', ''),
                type='client'
            )
            
            # Record in history
            initialize_history(
                title=name,
                event=f"Client created with ID {client.id}",
                table_name='client',
                history_id=client.history_id
            )
            
            # Return serialized response
            serializer = self.get_serializer(client)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {"error": f"Failed to create client: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
    @transaction.atomic
    def update(self, request, *args, **kwargs):
        client = self.get_object()
        name = request.data.get('name', client.name)
        address = request.data.get('address', client.address)
        code = request.data.get('code', client.code)
        description = request.data.get('description', client.description)
        team_id = request.data.get('team', client.team_id)
        
        try:
            # Update client
            client.name = name
            client.address = address
            client.code = code
            client.description = description
            client.team_id = team_id
            client.save()
            
            # Update contact if provided
            if 'contact' in request.data:
                contact_data = request.data.get('contact', {})
                try:
                    contact = Contact.objects.get(id=client.contact_id)
                    contact.address = contact_data.get('address', contact.address)
                    contact.email = contact_data.get('email', contact.email)
                    contact.phone = contact_data.get('phone', contact.phone)
                    contact.save()
                except Contact.DoesNotExist:
                    # Create contact if doesn't exist
                    Contact.objects.create(
                        id=client.contact_id,
                        address=contact_data.get('address', address),
                        email=contact_data.get('email', ''),
                        phone=contact_data.get('phone', ''),
                        type='client'
                    )
            
            # Record in history
            record_client_update(client, f"Client updated: {name}")
            
            serializer = self.get_serializer(client)
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {"error": f"Failed to update client: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def destroy(self, request, *args, **kwargs):
        client = self.get_object()
        
        # Check for dependencies
        related_projects = Project.objects.filter(client=client).count()
        if related_projects > 0:
            return Response(
                {
                    "error": f"Cannot delete client: {client.name}. It is associated with {related_projects} project(s).",
                    "dependencies": {"projects": related_projects}
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Record deletion in history before deleting the object
            record_client_deletion(client, f"Client deleted: {client.name}")
            
            # Delete associated contact
            try:
                contact = Contact.objects.get(id=client.contact_id)
                contact.delete()
            except Contact.DoesNotExist:
                pass
                
            # Call the parent destroy method
            return super().destroy(request, *args, **kwargs)
            
        except Exception as e:
            return Response(
                {"error": f"Failed to delete client: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
