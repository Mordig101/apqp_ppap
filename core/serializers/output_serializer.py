from rest_framework import serializers
from core.models import Output, OutputTemplate, Phase, Person
from core.serializers.output_template_serializer import OutputTemplateSerializer
from core.serializers.document_serializer import DocumentSerializer
from core.serializers.user_serializer import UserSerializer

class OutputSerializer(serializers.ModelSerializer):
    template_details = OutputTemplateSerializer(source='template', read_only=True)
    documents = DocumentSerializer(many=True, read_only=True)
    user_details = UserSerializer(source='user', read_only=True)
    
    class Meta:
        model = Output
        fields = '__all__'
        
    def create(self, validated_data):
        # Handle template_id if provided
        template_id = self.initial_data.get('template_id')
        if template_id and 'template' not in validated_data:
            try:
                validated_data['template'] = OutputTemplate.objects.get(id=template_id)
            except OutputTemplate.DoesNotExist:
                raise serializers.ValidationError({'template_id': f'Template with ID {template_id} not found'})
        
        # Handle phase_id if provided
        phase_id = self.initial_data.get('phase_id')
        if phase_id and 'phase' not in validated_data:
            try:
                validated_data['phase'] = Phase.objects.get(id=phase_id)
            except Phase.DoesNotExist:
                raise serializers.ValidationError({'phase_id': f'Phase with ID {phase_id} not found'})
                
        # Handle ppap_element_id if provided
        ppap_element_id = self.initial_data.get('ppap_element_id')
        if ppap_element_id and 'ppap_element' not in validated_data:
            try:
                from core.models import PPAPElement
                validated_data['ppap_element'] = PPAPElement.objects.get(id=ppap_element_id)
            except PPAPElement.DoesNotExist:
                raise serializers.ValidationError({'ppap_element_id': f'PPAP Element with ID {ppap_element_id} not found'})
                
        # Handle assigned_to_id if provided
        assigned_to_id = self.initial_data.get('assigned_to_id')
        if assigned_to_id and 'assigned_to' not in validated_data:
            try:
                validated_data['assigned_to'] = Person.objects.get(id=assigned_to_id)
            except Person.DoesNotExist:
                raise serializers.ValidationError({'assigned_to_id': f'Person with ID {assigned_to_id} not found'})
                
        return super().create(validated_data)
