from rest_framework import serializers
from core.models import FastQuery

class FastQuerySerializer(serializers.ModelSerializer):
    class Meta:
        model = FastQuery
        fields = '__all__'
