from rest_framework import serializers
from core.models import Person, Team

class TeamMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = ['id', 'name']

class PersonSerializer(serializers.ModelSerializer):
    teams = TeamMinimalSerializer(many=True, read_only=True)
    team_ids = serializers.PrimaryKeyRelatedField(
        many=True, 
        write_only=True, 
        queryset=Team.objects.all(),
        source='teams',
        required=False
    )
    
    class Meta:
        model = Person
        fields = '__all__'
