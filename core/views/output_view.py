from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from core.models import Output, History
from core.serializers.output_serializer import OutputSerializer
from core.serializers.history_serializer import HistorySerializer
from core.services.history.initialization import initialize_history

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
    def update(self, request, *args, **kwargs):
        output = self.get_object()
        serializer = self.get_serializer(output, data=request.data, partial=True)
        
        if serializer.is_valid():
            # Save the output
            output = serializer.save()
            
            # Record the update in history
            initialize_history(
                title=f"{output.template.name}",
                event=f"Output updated: {', '.join(request.data.keys())}",
                table_name='output',
                history_id=output.history_id
            )
            
            # Check if status changed to 'Completed'
            if 'status' in request.data and request.data['status'] == 'Completed':
                # Update phase status if all outputs are completed
                phase = output.phase
                all_outputs_completed = all(o.status == 'Completed' for o in phase.outputs.all())
                
                if all_outputs_completed and phase.status != 'Completed':
                    phase.status = 'Completed'
                    phase.save()
                    
                    # Record phase completion in history
                    initialize_history(
                        title=f"{phase.template.name}",
                        event=f"Phase marked as Completed as all outputs are completed",
                        table_name='phase',
                        history_id=phase.history_id
                    )
                    
                    # Check if all phases are completed to update PPAP status
                    ppap = phase.ppap
                    all_phases_completed = all(p.status == 'Completed' for p in ppap.phases.all())
                    
                    if all_phases_completed and ppap.status != 'Completed':
                        ppap.status = 'Completed'
                        ppap.save()
                        
                        # Record PPAP completion in history
                        initialize_history(
                            title=f"PPAP for Project {ppap.project_id}",
                            event=f"PPAP marked as Completed as all phases are completed",
                            table_name='ppap',
                            history_id=ppap.history_id
                        )
            
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
