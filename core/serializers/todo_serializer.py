from rest_framework import serializers
from core.models import Todo
from core.serializers.user_serializer import UserSerializer
from core.serializers.output_serializer import OutputSerializer
from core.serializers.permission_serializer import PermissionSerializer
from core.serializers.history_serializer import HistorySerializer
from core.models import History

class TodoSerializer(serializers.ModelSerializer):
    permission_details = PermissionSerializer(source='permission', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
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
        model = Todo
        fields = '__all__'
