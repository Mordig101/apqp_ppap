from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction
from core.models import PhaseTemplate, OutputTemplate, PPAPElement
from core.serializers.phase_template_serializer import PhaseTemplateSerializer
from core.serializers.output_template_serializer import OutputTemplateSerializer
from core.services.template.api import (
    initialize_phase_template,
    initialize_output_template,
    get_phase_templates_by_level,
    get_output_templates_by_phase,
    get_output_templates_by_element,
    clone_phase_template,
    clone_output_template
)

class PhaseTemplateViewSet(viewsets.ModelViewSet):
    queryset = PhaseTemplate.objects.all().order_by('order')
    serializer_class = PhaseTemplateSerializer
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        # Extract template data
        name = request.data.get('name')
        description = request.data.get('description', '')
        order = request.data.get('order')
        ppap_levels = request.data.get('ppap_levels', [])
        
        # Validate required fields
        if not all([name, order is not None]):
            return Response(
                {"error": "Missing required fields: name, order"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Create template
            template = initialize_phase_template(
                name=name,
                description=description,
                order=order,
                ppap_levels=ppap_levels
            )
            
            serializer = self.get_serializer(template)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def by_level(self, request):
        level = request.query_params.get('level')
        
        if not level:
            return Response(
                {"error": "Missing required parameter: level"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            level = int(level)
            templates = get_phase_templates_by_level(level)
            serializer = self.get_serializer(templates, many=True)
            return Response(serializer.data)
        except ValueError:
            return Response(
                {"error": "Level must be an integer"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def clone(self, request, pk=None):
        new_name = request.data.get('name')
        
        try:
            cloned_template = clone_phase_template(pk, new_name)
            serializer = self.get_serializer(cloned_template)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class OutputTemplateViewSet(viewsets.ModelViewSet):
    queryset = OutputTemplate.objects.all()
    serializer_class = OutputTemplateSerializer
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        # Extract template data
        name = request.data.get('name')
        phase_id = request.data.get('phase_id')
        ppap_element_id = request.data.get('ppap_element_id')
        configuration = request.data.get('configuration', {})
        
        # Validate required fields
        if not all([name, phase_id, ppap_element_id]):
            return Response(
                {"error": "Missing required fields: name, phase_id, ppap_element_id"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Get related objects
            phase_template = PhaseTemplate.objects.get(id=phase_id)
            ppap_element = PPAPElement.objects.get(id=ppap_element_id)
            
            # Create template
            template = initialize_output_template(
                name=name,
                phase_template=phase_template,
                ppap_element=ppap_element,
                configuration=configuration
            )
            
            serializer = self.get_serializer(template)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except PhaseTemplate.DoesNotExist:
            return Response(
                {"error": f"Phase template with ID {phase_id} not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except PPAPElement.DoesNotExist:
            return Response(
                {"error": f"PPAP element with ID {ppap_element_id} not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def by_phase(self, request):
        phase_id = request.query_params.get('phase_id')
        
        if not phase_id:
            return Response(
                {"error": "Missing required parameter: phase_id"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            templates = get_output_templates_by_phase(phase_id)
            serializer = self.get_serializer(templates, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def by_element(self, request):
        element_id = request.query_params.get('element_id')
        
        if not element_id:
            return Response(
                {"error": "Missing required parameter: element_id"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            templates = get_output_templates_by_element(element_id)
            serializer = self.get_serializer(templates, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def clone(self, request, pk=None):
        new_name = request.data.get('name')
        
        try:
            cloned_template = clone_output_template(pk, new_name)
            serializer = self.get_serializer(cloned_template)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
