from rest_framework import serializers
from core.models import TeamMemberRole
from core.serializers.person_serializer import PersonSerializer

class TeamMemberRoleSerializer(serializers.ModelSerializer):
    person_details = PersonSerializer(source='person', read_only=True)
    
    class Meta:
        model = TeamMemberRole
        fields = ['id', 'person', 'team', 'role', 'history_id', 'person_details']
        read_only_fields = ['history_id']
