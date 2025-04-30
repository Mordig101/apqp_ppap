from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from core.models import Phase, History
from core.serializers.phase_serializer import PhaseSerializer
from core.serializers.history_serializer import HistorySerializer

class PhaseViewSet(viewsets.ModelViewSet):
    queryset = Phase.objects.all()
    serializer_class = PhaseSerializer
    
    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        phase = self.get_object()
        history_records = History.objects.filter(id=phase.history_id)
        serializer = HistorySerializer(history_records, many=True)
        return Response(serializer.data)
