from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from core.models import PPAP, History
from core.serializers.ppap_serializer import PPAPSerializer
from core.serializers.history_serializer import HistorySerializer

from django.db import transaction
from rest_framework import status

# Add these imports
from core.services.ppap.api import get_ppap_details
from core.services.history.ppap import (
    record_ppap_customer_submission, 
    record_ppap_customer_decision
)

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

    # Add these actions to your PPAPViewSet
    @action(detail=True, methods=['get'])
    def details(self, request, pk=None):
        """Get comprehensive PPAP details including phases and outputs"""
        try:
            ppap_details = get_ppap_details(pk)
            return Response(ppap_details)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def customer_submission(self, request, pk=None):
        """Record PPAP submission to customer"""
        try:
            ppap = self.get_object()
            submission_date = request.data.get('submission_date')
            
            # Parse date if provided
            from django.utils.dateparse import parse_datetime
            parsed_date = parse_datetime(submission_date) if submission_date else None
            
            # Record submission
            history = record_ppap_customer_submission(ppap, submission_date=parsed_date)
            
            # Update PPAP status to submitted
            ppap.status = 'Submitted'
            ppap.save(update_fields=['status'])
            
            serializer = self.get_serializer(ppap)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def customer_decision(self, request, pk=None):
        """Record customer decision on PPAP"""
        try:
            ppap = self.get_object()
            decision = request.data.get('decision')
            comments = request.data.get('comments')
            
            if not decision:
                return Response(
                    {'error': 'Decision is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Record decision
            history = record_ppap_customer_decision(ppap, decision, comments)
            
            # Update PPAP status based on decision
            if decision.lower() in ['approved', 'accepted']:
                ppap.status = 'Approved'
            elif decision.lower() in ['rejected', 'denied']:
                ppap.status = 'Rejected'
            elif decision.lower() in ['conditional', 'interim']:
                ppap.status = 'Conditionally Approved'
            ppap.review = comments
            ppap.save(update_fields=['status', 'review'])
            
            serializer = self.get_serializer(ppap)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
