from rest_framework import serializers
from core.models import PPAP
from core.serializers.phase_serializer import PhaseSerializer

class PPAPSerializer(serializers.ModelSerializer):
    phases = PhaseSerializer(many=True, read_only=True)
    
    class Meta:
        model = PPAP
        fields = '__all__'
