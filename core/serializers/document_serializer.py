from rest_framework import serializers
from core.models import Document
from core.serializers.user_serializer import UserSerializer

class DocumentSerializer(serializers.ModelSerializer):
    uploader_details = UserSerializer(source='uploader', read_only=True)
    
    class Meta:
        model = Document
        fields = '__all__'
