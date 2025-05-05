from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction

from core.models import PPAPElement
from core.serializers.ppap_element_serializer import PPAPElementSerializer
from core.services.ppap_element.api import (
    get_ppap_elements_by_level,
    get_all_ppap_elements
)
from core.services.ppap_element.seeder import seed_standard_ppap_elements

class PPAPElementViewSet(viewsets.ModelViewSet):
    """
    ViewSet for PPAP Elements
    """
    queryset = PPAPElement.objects.all()
    serializer_class = PPAPElementSerializer

    @action(detail=False, methods=['get'])
    def by_level(self, request):
        """
        Get PPAP elements for a specific level
        """
        level = request.query_params.get('level')
        if not level:
            return Response({"error": "Level parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        elements = get_ppap_elements_by_level(level)
        serializer = self.get_serializer(elements, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    @transaction.atomic
    def seed(self, request):
        """
        Seed standard PPAP elements
        """
        elements = seed_standard_ppap_elements()
        serializer = self.get_serializer(elements, many=True)
        return Response({
            "message": f"Successfully seeded {len(elements)} PPAP elements",
            "elements": serializer.data
        })