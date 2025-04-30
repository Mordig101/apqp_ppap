from rest_framework import viewsets, status
from rest_framework.response import Response
from django.db import transaction
from core.models import Client, Contact
from core.serializers.client_serializer import ClientSerializer
from core.services.history.initialization import initialize_history

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
                description=description
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
            
            serializer = self.get_serializer(client)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
