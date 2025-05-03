from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction
from core.models import Contact
from core.serializers.contact_serializer import ContactSerializer
from core.services.contact.api import (
    initialize_contact,
    update_contact,
    delete_contact,
    get_person_by_contact,
    get_client_by_contact
)
from core.services.history.contact import record_contact_creation, record_contact_update, record_contact_deletion

class ContactViewSet(viewsets.ModelViewSet):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        # Extract data
        address = request.data.get('address', '')
        email = request.data.get('email', '')
        phone = request.data.get('phone', '')
        contact_type = request.data.get('type', 'unknown')
        
        try:
            # Generate ID for the contact if not provided
            contact_id = request.data.get('id')
            if not contact_id:
                import uuid
                contact_id = f"{uuid.uuid4().hex}contact"
            
            # Create contact
            contact = Contact.objects.create(
                id=contact_id,
                address=address,
                email=email,
                phone=phone,
                type=contact_type
            )
            
            # Record in history
            record_contact_creation(contact)
            
            serializer = self.get_serializer(contact)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @transaction.atomic
    def update(self, request, *args, **kwargs):
        contact = self.get_object()
        
        # Extract contact data
        address = request.data.get('address')
        email = request.data.get('email')
        phone = request.data.get('phone')
        
        try:
            # Update contact
            updated_contact = update_contact(
                contact=contact,
                address=address,
                email=email,
                phone=phone
            )
            
            # Record in history
            record_contact_update(updated_contact)
            
            serializer = self.get_serializer(updated_contact)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        contact = self.get_object()
        
        # Check if contact is associated with a person or client
        person = get_person_by_contact(contact.id)
        client = get_client_by_contact(contact.id)
        
        if person or client:
            entity_type = "person" if person else "client"
            entity_id = person.id if person else client.id
            return Response(
                {"error": f"Cannot delete contact. It is associated with a {entity_type} (ID: {entity_id})"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Delete contact
        delete_contact(contact)
        
        # Record in history
        record_contact_deletion(contact)
        
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=False, methods=['get'])
    def by_type(self, request):
        type = request.query_params.get('type')
        
        if not type:
            return Response(
                {"error": "Missing required parameter: type"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        valid_types = ['person', 'client', 'client_member']
        if type not in valid_types:
            return Response(
                {"error": f"Invalid type. Must be one of: {', '.join(valid_types)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        contacts = Contact.objects.filter(type=type)
        serializer = self.get_serializer(contacts, many=True)
        return Response(serializer.data)
