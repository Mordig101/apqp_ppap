from rest_framework import serializers
from core.models import Team
from core.serializers.person_serializer import PersonSerializer
from core.serializers.history_serializer import HistorySerializer
from core.models import History

class TeamSerializer(serializers.ModelSerializer):
    members = PersonSerializer(many=True, read_only=True)
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
        model = Team
        fields = '__all__'
