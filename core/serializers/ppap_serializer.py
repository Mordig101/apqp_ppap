from rest_framework import serializers
from core.models import PPAP
from core.serializers.phase_serializer import PhaseSerializer
from core.serializers.history_serializer import HistorySerializer
from core.models import History
class PPAPSerializer(serializers.ModelSerializer):
    phases = PhaseSerializer(many=True, read_only=True)
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
        model = PPAP
        fields = '__all__'
