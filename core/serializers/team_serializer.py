from rest_framework import serializers
from core.models import Team, TeamMemberRole
from core.serializers.person_serializer import PersonSerializer
from core.serializers.team_member_role_serializer import TeamMemberRoleSerializer

class TeamSerializer(serializers.ModelSerializer):
    members = PersonSerializer(many=True, read_only=True)
    member_roles = TeamMemberRoleSerializer(many=True, read_only=True)
    
    class Meta:
        model = Team
        fields = ['id', 'name', 'description', 'history_id', 'department', 'members', 'member_roles']
        
    def validate(self, data):
        # Validate that name is provided and not empty
        if not data.get('name'):
            raise serializers.ValidationError({'name': 'This field is required.'})
            
        # Validate name length
        if len(data.get('name', '')) > 255:
            raise serializers.ValidationError({'name': 'Name cannot exceed 255 characters.'})
            
        # If department is provided, validate it exists
        if 'department' in data and data['department'] is not None:
            try:
                Department.objects.get(pk=data['department'].id)
            except Department.DoesNotExist:
                raise serializers.ValidationError({'department': 'Invalid department ID.'})
                
        return data
