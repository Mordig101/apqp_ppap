from rest_framework import serializers
from core.models import Phase , History
from core.serializers.phase_template_serializer import PhaseTemplateSerializer
from core.serializers.output_serializer import OutputSerializer
from core.serializers.user_serializer import UserSerializer
from core.serializers.history_serializer import HistorySerializer
class PhaseSerializer(serializers.ModelSerializer):
    template_details = PhaseTemplateSerializer(source='template', read_only=True)
    outputs = OutputSerializer(many=True, read_only=True)
    responsible_details = UserSerializer(source='responsible', read_only=True)
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
        model = Phase
        fields = '__all__'
