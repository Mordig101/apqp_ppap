from rest_framework import serializers
from core.models import Todo
from core.serializers.user_serializer import UserSerializer
from core.serializers.output_serializer import OutputSerializer
from core.serializers.permission_serializer import PermissionSerializer

class TodoSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    output_details = OutputSerializer(source='output', read_only=True)
    permission_details = PermissionSerializer(source='permission', read_only=True)
    
    class Meta:
        model = Todo
        fields = '__all__'
