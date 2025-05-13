from rest_framework import serializers
from core.models import Contact, History
from core.serializers.history_serializer import HistorySerializer

class ContactSerializer(serializers.ModelSerializer):
    history_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Contact
        fields = '__all__'
    
    def get_history_details(self, obj):
        """Get history details for this contact"""
        if hasattr(obj, 'history_id') and obj.history_id:
            try:
                history = History.objects.get(id=obj.history_id)
                return HistorySerializer(history).data
            except History.DoesNotExist:
                return None
        return None
