from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from core.models import Phase, History, PhaseTemplate, PPAP
from core.serializers.phase_serializer import PhaseSerializer
from core.serializers.history_serializer import HistorySerializer
from core.services.phase.api import create_phase, update_phase, update_phase_history

class PhaseViewSet(viewsets.ModelViewSet):
    queryset = Phase.objects.all()
    serializer_class = PhaseSerializer
    
    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        phase = self.get_object()
        history_records = History.objects.filter(id=phase.history_id)
        serializer = HistorySerializer(history_records, many=True)
        return Response(serializer.data)
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        # Extract data
        template_id = request.data.get('template_id')
        ppap_id = request.data.get('ppap_id')
        responsible_id = request.data.get('responsible_id')
        status_value = request.data.get('status', 'Not Started')
        
        # Verify template and PPAP exist before proceeding
        try:
            PhaseTemplate.objects.get(id=template_id)
        except PhaseTemplate.DoesNotExist:
            return Response(
                {'error': f'PhaseTemplate with ID {template_id} does not exist'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            PPAP.objects.get(id=ppap_id)
        except PPAP.DoesNotExist:
            return Response(
                {'error': f'PPAP with ID {ppap_id} does not exist'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
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
        # For backward compatibility - check for history_* fields
        else:
            if request.data.get('history_title'):
                history_attrs['title'] = request.data.get('history_title')
            if request.data.get('history_deadline'):
                history_attrs['deadline'] = request.data.get('history_deadline')
            if request.data.get('history_started_at'):
                history_attrs['started_at'] = request.data.get('history_started_at')
            if request.data.get('history_finished_at'):
                history_attrs['finished_at'] = request.data.get('history_finished_at')
        
        try:
            # Create phase with history attributes
            phase = create_phase(
                template_id=template_id,
                ppap_id=ppap_id,
                responsible_id=responsible_id,
                status=status_value,
                history_attrs=history_attrs if history_attrs else None
            )
            
            serializer = self.get_serializer(phase)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @transaction.atomic
    def update(self, request, *args, **kwargs):
        phase_id = kwargs.get('pk')
        
        # Build update data
        update_data = {}
        
        # Extract phase data
        if 'responsible_id' in request.data:
            update_data['responsible_id'] = request.data.get('responsible_id')
        if 'status' in request.data:
            update_data['status'] = request.data.get('status')
        
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
        # For backward compatibility - check for history_* fields
        else:
            if request.data.get('history_title'):
                history_attrs['title'] = request.data.get('history_title')
            if request.data.get('history_deadline'):
                history_attrs['deadline'] = request.data.get('history_deadline')
            if request.data.get('history_started_at'):
                history_attrs['started_at'] = request.data.get('history_started_at')
            if request.data.get('history_finished_at'):
                history_attrs['finished_at'] = request.data.get('history_finished_at')
        
        # Add history attributes to update_data if present
        if history_attrs:
            update_data['history'] = history_attrs
        
        try:
            # Update phase with history attributes
            # The update_phase function will now handle ALL recording
            updated_phase = update_phase(phase_id, update_data)
            
            # No need for additional recording here - it's all done in update_phase
            
            serializer = self.get_serializer(updated_phase)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
            
    @action(detail=True, methods=['put'])
    def update_history(self, request, pk=None):
        """Update only history attributes for this phase"""
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
            history = update_phase_history(pk, history_attrs)
            if not history:
                return Response(
                    {'error': 'History record not found for this phase'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Return updated history
            serializer = HistorySerializer(history)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
