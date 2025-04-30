from rest_framework import serializers
from core.models import Team, TeamMemberRole
from core.serializers.person_serializer import PersonSerializer
from core.serializers.team_member_role_serializer import TeamMemberRoleSerializer

class TeamSerializer(serializers.ModelSerializer):
    members = PersonSerializer(many=True, read_only=True)
    member_roles = TeamMemberRoleSerializer(many=True, read_only=True)
    
    class Meta:
        model = Team
        fields = '__all__'
