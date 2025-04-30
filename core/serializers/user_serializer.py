from rest_framework import serializers
from core.models import User
from core.serializers.person_serializer import PersonSerializer

class UserSerializer(serializers.ModelSerializer):
    person_details = PersonSerializer(source='person', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'person', 'person_details', 'authorization', 'last_login', 'is_active', 'history_id']
        extra_kwargs = {'password': {'write_only': True}}
    
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user
