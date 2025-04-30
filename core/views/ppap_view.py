from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from core.models import PPAP, History
from core.serializers.ppap_serializer import PPAPSerializer
from core.serializers.history_serializer import HistorySerializer

class PPAPViewSet(viewsets.ModelViewSet):
    queryset = PPAP.objects.all()
    serializer_class = PPAPSerializer
    
    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        ppap = self.get_object()
        history_records = History.objects.filter(id=ppap.history_id)
        serializer = HistorySerializer(history_records, many=True)
        return Response(serializer.data)
