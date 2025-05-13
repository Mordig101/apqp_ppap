from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from core.models import Output, History
from core.serializers.output_serializer import OutputSerializer
from core.serializers.history_serializer import HistorySerializer
from core.services.output.api import (
    create_output, 
    update_output, 
    update_output_history
)

class OutputViewSet(viewsets.ModelViewSet):
    queryset = Output.objects.all()
    serializer_class = OutputSerializer
    
    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        output = self.get_object()
        history_records = History.objects.filter(id=output.history_id)
        serializer = HistorySerializer(history_records, many=True)
        return Response(serializer.data)
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        # Extract required fields
        template_id = request.data.get('template_id')
        phase_id = request.data.get('phase_id')
        
        # Validate required fields
        if not template_id:
            return Response(
                {'error': 'template_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not phase_id:
            return Response(
                {'error': 'phase_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Other fields
        description = request.data.get('description', '')
        status_value = request.data.get('status', 'Not Started')
        user_id = request.data.get('user_id')
        
        # Extract history attributes
        history_attrs = {}
        if 'history' in request.data and isinstance(request.data['history'], dict):
            history_data = request.data['history']
            if 'title' in history_data:
                history_attrs['title'] = history_data['title']
            if 'deadline' in history_data:
                history_attrs['deadline'] = history_data['deadline']
            if 'started_at' in history_data:
                history_attrs['started_at'] = history_data['started_at']
            if 'finished_at' in history_data:
                history_attrs['finished_at'] = history_data['finished_at']
        
        try:
            # Check if template exists
            from core.models import OutputTemplate
            try:
                OutputTemplate.objects.get(id=template_id)
            except OutputTemplate.DoesNotExist:
                return Response(
                    {'error': f'OutputTemplate with id {template_id} does not exist'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check if phase exists
            from core.models import Phase
            try:
                Phase.objects.get(id=phase_id)
            except Phase.DoesNotExist:
                return Response(
                    {'error': f'Phase with id {phase_id} does not exist'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Create output with history attributes
            output_data = {
                'template_id': template_id,
                'phase_id': phase_id,
                'description': description,
                'status': status_value,
                'user_id': user_id
            }
            
            if history_attrs:
                output_data['history'] = history_attrs
                
            output = create_output(output_data)
            
            # If a status was explicitly provided and it's different from what we got back,
            # force update it again to override automatic changes
            if status_value and output.status != status_value:
                output.status = status_value
                output.save(update_fields=['status'])
        
            serializer = self.get_serializer(output)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @transaction.atomic
    def update(self, request, *args, **kwargs):
        output_id = kwargs.get('pk')
        
        # Build update data
        update_data = {}
        
        # Extract output data and remember original status if provided
        original_status = None
        if 'status' in request.data:
            update_data['status'] = request.data.get('status')
            original_status = request.data.get('status')
        
        if 'description' in request.data:
            update_data['description'] = request.data.get('description')
        if 'user_id' in request.data:
            update_data['user_id'] = request.data.get('user_id')
        
        # Extract history attributes
        history_attrs = {}
        # Check if we have a history object in the request
        if 'history' in request.data and isinstance(request.data['history'], dict):
            history_data = request.data['history']
            if 'title' in history_data:
                history_attrs['title'] = history_data['title']
            if 'deadline' in history_data:
                history_attrs['deadline'] = history_data['deadline']
            if 'started_at' in history_data:
                history_attrs['started_at'] = history_data['started_at']
            if 'finished_at' in history_data:
                history_attrs['finished_at'] = history_data['finished_at']
        
        try:
            # Update output with standard fields
            updated_output = update_output(output_id, update_data)
            
            # Update history attributes separately if provided
            if history_attrs:
                update_output_history(output_id, history_attrs)
            
            # If status was explicitly provided, ensure it's not overridden
            if original_status and updated_output.status != original_status:
                updated_output.status = original_status
                updated_output.save(update_fields=['status'])
        
            serializer = self.get_serializer(updated_output)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['put'])
    def update_history(self, request, pk=None):
        """Update only history attributes for this output"""
        try:
            # Get history attributes from request
            history_attrs = {}
            if 'title' in request.data:
                history_attrs['title'] = request.data.get('title')
            if 'deadline' in request.data:
                history_attrs['deadline'] = request.data.get('deadline')
            if 'started_at' in request.data:
                history_attrs['started_at'] = request.data.get('started_at')
            if 'finished_at' in request.data:
                history_attrs['finished_at'] = request.data.get('finished_at')
            
            # Update history
            history = update_output_history(pk, history_attrs)
            if not history:
                return Response(
                    {'error': 'History record not found for this output'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Return updated history
            serializer = HistorySerializer(history)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
