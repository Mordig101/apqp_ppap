from rest_framework import serializers
from core.models import Output
from core.serializers.output_template_serializer import OutputTemplateSerializer
from core.serializers.document_serializer import DocumentSerializer
from core.serializers.user_serializer import UserSerializer

class OutputSerializer(serializers.ModelSerializer):
    template_details = OutputTemplateSerializer(source='template', read_only=True)
    documents = DocumentSerializer(many=True, read_only=True)
    user_details = UserSerializer(source='user', read_only=True)
    
    class Meta:
        model = Output
        fields = '__all__'
