from rest_framework import serializers
from core.models import Team
from core.serializers.person_serializer import PersonSerializer

class TeamSerializer(serializers.ModelSerializer):
    members = PersonSerializer(many=True, read_only=True)
    
    class Meta:
        model = Team
        fields = '__all__'
