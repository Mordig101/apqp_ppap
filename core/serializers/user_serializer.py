from rest_framework import serializers
from core.models import User
from core.serializers.person_serializer import PersonSerializer
from core.serializers.contact_serializer import ContactSerializer

class UserSerializer(serializers.ModelSerializer):
    person_details = PersonSerializer(source='person', read_only=True)
    contact_details = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'person', 'person_details', 'contact_details', 'authorization', 'last_login', 'is_active', 'history_id']
        extra_kwargs = {'password': {'write_only': True}}
    
    def get_contact_details(self, obj):
        """Get contact details from person's contact_id"""
        from core.models import Contact
        
        if obj.person and obj.person.contact_id:
            try:
                contact = Contact.objects.get(id=obj.person.contact_id)
                return {
                    'id': contact.id,
                    'email': contact.email,
                    'phone': contact.phone,
                    'address': contact.address,
                    'type': contact.type
                }
            except Contact.DoesNotExist:
                pass
        return None
    
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user
    
    def update(self, instance, validated_data):
        """Handle updating user data"""
        # Update user attributes from validated_data
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Get additional data from request
        request_data = self.context.get('request').data if self.context.get('request') else {}
        
        # Handle contact updates if provided
        contact_data = request_data.get('contact', {})
        if contact_data and instance.person and instance.person.contact_id:
            from core.models import Contact
            try:
                contact = Contact.objects.get(id=instance.person.contact_id)
                
                # Update contact fields
                if 'email' in contact_data:
                    contact.email = contact_data['email']
                if 'phone' in contact_data:
                    contact.phone = contact_data['phone']
                if 'address' in contact_data:
                    contact.address = contact_data['address']
                
                contact.save()
            except Contact.DoesNotExist:
                pass
        
        instance.save()
        return instance
