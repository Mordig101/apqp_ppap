from rest_framework import serializers
from core.models import Person, Team, History
from core.serializers.history_serializer import HistorySerializer


class TeamMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = ['id', 'name']

class PersonMinimalSerializer(serializers.ModelSerializer):
    """Minimal serializer for Person to avoid circular references"""
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Person
        fields = ['id', 'full_name']
        
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

class PersonSerializer(serializers.ModelSerializer):
    teams = TeamMinimalSerializer(many=True, read_only=True)
    team_ids = serializers.PrimaryKeyRelatedField(
        many=True, 
        write_only=True, 
        queryset=Team.objects.all(),
        source='teams',
        required=False
    )
    replacer_details = PersonMinimalSerializer(source='replacer', read_only=True)
    replacer_id = serializers.PrimaryKeyRelatedField(
        queryset=Person.objects.all(),
        source='replacer',
        required=False,
        allow_null=True,
        write_only=True
    )
    history_details = serializers.SerializerMethodField()
    
    
    def get_history_details(self, obj):
        """Get history details for this object"""
        if hasattr(obj, 'history_id') and obj.history_id:
            try:
                history = History.objects.get(id=obj.history_id)
                return HistorySerializer(history).data
            except History.DoesNotExist:
                return None
        return None
    class Meta:
        model = Person
        fields = '__all__'
