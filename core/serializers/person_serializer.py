from rest_framework import serializers
from core.models import Person
from core.serializers.department_serializer import DepartmentSerializer

class PersonSerializer(serializers.ModelSerializer):
    department_details = DepartmentSerializer(source='department', read_only=True)
    
    class Meta:
        model = Person
        fields = ['id', 'first_name', 'last_name', 'contact_id', 'team', 
                 'department', 'department_details', 'is_user', 'history_id']
        read_only_fields = ['history_id']
