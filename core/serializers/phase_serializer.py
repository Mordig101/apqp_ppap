from rest_framework import serializers
from core.models import Phase
from core.serializers.phase_template_serializer import PhaseTemplateSerializer
from core.serializers.output_serializer import OutputSerializer
from core.serializers.user_serializer import UserSerializer

class PhaseSerializer(serializers.ModelSerializer):
    template_details = PhaseTemplateSerializer(source='template', read_only=True)
    outputs = OutputSerializer(many=True, read_only=True)
    responsible_details = UserSerializer(source='responsible', read_only=True)
    
    class Meta:
        model = Phase
        fields = '__all__'
