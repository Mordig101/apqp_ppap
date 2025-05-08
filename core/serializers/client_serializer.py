from rest_framework import serializers
from core.models import Client, Contact, Team, Person
from core.serializers.contact_serializer import ContactSerializer
from core.serializers.team_serializer import TeamSerializer

class ClientSerializer(serializers.ModelSerializer):
    contact = ContactSerializer(read_only=True)
    contact_details = serializers.SerializerMethodField(read_only=True)
    team_details = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Client
        fields = '__all__'
    
    def get_contact_details(self, obj):
        """Get contact details from client's contact_id"""
        if obj.contact_id:
            try:
                contact = Contact.objects.get(id=obj.contact_id)
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
    
    def get_team_details(self, obj):
        """
        Get team details including all team members and their contact information.
        This fetches persons who are associated with the same team as the client.
        """
        if not obj.team:
            return None
            
        # Get basic team info
        team_info = {
            'id': obj.team.id,
            'name': obj.team.name,
            'description': obj.team.description,
            'history_id': obj.team.history_id,
            'members': []
        }
        
        # Get all persons in this team
        team_members = Person.objects.filter(teams=obj.team)
        
        # Add each member with their contact details
        for person in team_members:
            member_info = {
                'id': person.id,
                'first_name': person.first_name,
                'last_name': person.last_name,
                'contact_details': None
            }
            
            # Get contact details for this person
            try:
                if person.contact_id:
                    contact = Contact.objects.get(id=person.contact_id)
                    member_info['contact_details'] = {
                        'id': contact.id,
                        'email': contact.email,
                        'phone': contact.phone,
                        'address': contact.address
                    }
            except Contact.DoesNotExist:
                pass
                
            team_info['members'].append(member_info)
            
        return team_info
    
    def update(self, instance, validated_data):
        """Handle updating client data"""
        # Update client attributes from validated_data
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Get additional data from request
        request_data = self.context.get('request').data if self.context.get('request') else {}
        
        # Handle contact updates if provided
        contact_data = request_data.get('contact', {})
        if contact_data and instance.contact_id:
            try:
                contact = Contact.objects.get(id=instance.contact_id)
                
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
        
        # Handle team update if provided
        team_id = request_data.get('team_id')
        if team_id is not None:  # Check for None specifically to allow clearing team (setting to null)
            try:
                if team_id:  # If team_id is not empty/null
                    team = Team.objects.get(id=team_id)
                    instance.team = team
                else:
                    instance.team = None
            except Team.DoesNotExist:
                pass
        
        instance.save()
        return instance
