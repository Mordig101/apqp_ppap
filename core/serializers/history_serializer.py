from rest_framework import serializers
from core.models import History
import json

class HistorySerializer(serializers.ModelSerializer):
    events = serializers.SerializerMethodField()
    
    class Meta:
        model = History
        fields = [
            'id', 'title', 'table_name', 'created_at', 
            'started_at', 'updated_at', 'deadline', 'finished_at',
            'events'  # Replacing 'event' field with parsed 'events'
        ]
    
    def get_events(self, obj):
        """Parse the JSON events string into a list of event objects"""
        try:
            return json.loads(obj.event)
        except (json.JSONDecodeError, TypeError):
            # If event isn't valid JSON, return it as a single event
            return [{
                "type": "unknown",
                "details": obj.event or "No details available",
                "timestamp": obj.created_at.isoformat() if obj.created_at else None
            }]
