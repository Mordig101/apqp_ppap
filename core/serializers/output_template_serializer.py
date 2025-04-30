from rest_framework import serializers
from core.models import OutputTemplate
from core.serializers.ppap_element_serializer import PPAPElementSerializer

class OutputTemplateSerializer(serializers.ModelSerializer):
    ppap_element_details = PPAPElementSerializer(source='ppap_element', read_only=True)
    
    class Meta:
        model = OutputTemplate
        fields = '__all__'
