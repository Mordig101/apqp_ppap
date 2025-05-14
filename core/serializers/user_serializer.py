from rest_framework import serializers
from core.models import User
from core.serializers.person_serializer import PersonSerializer

class UserSerializer(serializers.ModelSerializer):
    person_details = PersonSerializer(source='person', read_only=True)
    # Add these fields to expose them directly at the user level
    role = serializers.CharField(source='person.role', required=False, allow_null=True)
    replacer_id = serializers.IntegerField(source='person.replacer_id', required=False, allow_null=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'authorization', 'is_active', 'is_staff', 
                  'is_superuser', 'person', 'person_details', 'role', 'replacer_id']
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
