from rest_framework import serializers
from core.models import Department

class DepartmentSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Department
        fields = ['id', 'name', 'responsible', 'history_id']
