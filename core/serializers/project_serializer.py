from rest_framework import serializers
from core.models import Project
from core.serializers.client_serializer import ClientSerializer
from core.serializers.team_serializer import TeamSerializer
from core.serializers.ppap_serializer import PPAPSerializer
from core.serializers.history_serializer import HistorySerializer
from core.models import History

class ProjectSerializer(serializers.ModelSerializer):
    client_details = ClientSerializer(source='client', read_only=True)
    team_details = TeamSerializer(source='team', read_only=True)
    ppap_details = PPAPSerializer(source='ppap', read_only=True)
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
        model = Project
        fields = '__all__'
