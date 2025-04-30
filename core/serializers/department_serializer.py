from rest_framework import serializers
from core.models import Department
from core.serializers.person_serializer import PersonSerializer

class DepartmentSerializer(serializers.ModelSerializer):
    members = PersonSerializer(many=True, read_only=True)
    
    class Meta:
        model = Department
        fields = '__all__'
