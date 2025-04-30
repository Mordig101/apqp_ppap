from rest_framework import serializers
from core.models import (
    Project, PPAP, Phase, Output, Document, User, Client, Team,
    Person, Contact, Department, History, FastQuery, PhaseTemplate,
    OutputTemplate, PPAPElement, Todo, Permission, Authorization
)

class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = '__all__'

class PersonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Person
        fields = '__all__'

class AuthorizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Authorization
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    person_details = PersonSerializer(source='person', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'person', 'person_details', 'authorization', 'last_login', 'is_active', 'history_id']
        extra_kwargs = {'password': {'write_only': True}}
    
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class TeamSerializer(serializers.ModelSerializer):
    members = PersonSerializer(many=True, read_only=True)
    
    class Meta:
        model = Team
        fields = '__all__'

class DepartmentSerializer(serializers.ModelSerializer):
    members = PersonSerializer(many=True, read_only=True)
    
    class Meta:
        model = Department
        fields = '__all__'

class ClientSerializer(serializers.ModelSerializer):
    contact = ContactSerializer(read_only=True)
    
    class Meta:
        model = Client
        fields = '__all__'

class PPAPElementSerializer(serializers.ModelSerializer):
    class Meta:
        model = PPAPElement
        fields = '__all__'

class OutputTemplateSerializer(serializers.ModelSerializer):
    ppap_element_details = PPAPElementSerializer(source='ppap_element', read_only=True)
    
    class Meta:
        model = OutputTemplate
        fields = '__all__'

class PhaseTemplateSerializer(serializers.ModelSerializer):
    output_templates = OutputTemplateSerializer(many=True, read_only=True)
    
    class Meta:
        model = PhaseTemplate
        fields = '__all__'

class DocumentSerializer(serializers.ModelSerializer):
    uploader_details = UserSerializer(source='uploader', read_only=True)
    
    class Meta:
        model = Document
        fields = '__all__'

class OutputSerializer(serializers.ModelSerializer):
    template_details = OutputTemplateSerializer(source='template', read_only=True)
    documents = DocumentSerializer(many=True, read_only=True)
    user_details = UserSerializer(source='user', read_only=True)
    
    class Meta:
        model = Output
        fields = '__all__'

class PhaseSerializer(serializers.ModelSerializer):
    template_details = PhaseTemplateSerializer(source='template', read_only=True)
    outputs = OutputSerializer(many=True, read_only=True)
    responsible_details = UserSerializer(source='responsible', read_only=True)
    
    class Meta:
        model = Phase
        fields = '__all__'

class PPAPSerializer(serializers.ModelSerializer):
    phases = PhaseSerializer(many=True, read_only=True)
    
    class Meta:
        model = PPAP
        fields = '__all__'

class FastQuerySerializer(serializers.ModelSerializer):
    class Meta:
        model = FastQuery
        fields = '__all__'

class ProjectSerializer(serializers.ModelSerializer):
    client_details = ClientSerializer(source='client', read_only=True)
    team_details = TeamSerializer(source='team', read_only=True)
    ppap_details = PPAPSerializer(source='ppap', read_only=True)
    
    class Meta:
        model = Project
        fields = '__all__'

class HistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = History
        fields = '__all__'

class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = '__all__'

class TodoSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    output_details = OutputSerializer(source='output', read_only=True)
    permission_details = PermissionSerializer(source='permission', read_only=True)
    
    class Meta:
        model = Todo
        fields = '__all__'
