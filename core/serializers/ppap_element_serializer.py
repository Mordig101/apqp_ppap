from rest_framework import serializers
from core.models import PPAPElement

class PPAPElementSerializer(serializers.ModelSerializer):
    class Meta:
        model = PPAPElement
        fields = '__all__'
