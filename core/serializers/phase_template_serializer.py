from rest_framework import serializers
from core.models import PhaseTemplate
from core.serializers.output_template_serializer import OutputTemplateSerializer

class PhaseTemplateSerializer(serializers.ModelSerializer):
    output_templates = OutputTemplateSerializer(many=True, read_only=True)
    
    class Meta:
        model = PhaseTemplate
        fields = '__all__'
