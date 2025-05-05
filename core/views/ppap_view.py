from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from core.models import PPAP, History
from core.serializers.ppap_serializer import PPAPSerializer
from core.serializers.history_serializer import HistorySerializer

from django.db import transaction
from rest_framework import status

class PPAPViewSet(viewsets.ModelViewSet):
    queryset = PPAP.objects.all()
    serializer_class = PPAPSerializer

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        # Extract data from request
        project_id = request.data.get('project')
        level = request.data.get('level')
        ppap_status = request.data.get('status', 'Not Started')  # Renamed from status to ppap_status

        try:
            # Try to get existing PPAP for this project
            ppap, created = PPAP.objects.get_or_create(
                project_id=project_id,
                defaults={
                    'level': level,
                    'status': ppap_status  # Use the renamed variable
                }
            )

            # If it already existed, update it
            if not created:
                ppap.level = level
                ppap.status = ppap_status  # Use the renamed variable
                ppap.save()

            serializer = self.get_serializer(ppap)
            return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        ppap = self.get_object()
        history_records = History.objects.filter(id=ppap.history_id)
        serializer = HistorySerializer(history_records, many=True)
        return Response(serializer.data)
