from rest_framework import serializers
from core.models import Project
from core.serializers.client_serializer import ClientSerializer
from core.serializers.team_serializer import TeamSerializer
from core.serializers.ppap_serializer import PPAPSerializer

class ProjectSerializer(serializers.ModelSerializer):
    client_details = ClientSerializer(source='client', read_only=True)
    team_details = TeamSerializer(source='team', read_only=True)
    ppap_details = PPAPSerializer(source='ppap', read_only=True)
    
    class Meta:
        model = Project
        fields = '__all__'
