from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.utils import timezone
from datetime import datetime
import uuid

from core.models import Phase, Output, History
from core.services.history.api import (
    update_history_dates,
    set_entity_deadline,
    get_entity_deadline,
    bulk_update_entity_deadlines
)

class HistoryEditorViewSet(viewsets.ViewSet):
    """
    ViewSet for editing history records
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def update_dates(self, request):
        """
        Update dates for a history record
        """
        history_id = request.data.get('history_id')
        deadline = request.data.get('deadline')
        started_at = request.data.get('started_at')
        completed_at = request.data.get('completed_at')
        
        if not history_id:
            return Response({"error": "history_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Parse dates if provided
        deadline_date = None
        if deadline:
            try:
                deadline_date = timezone.make_aware(datetime.fromisoformat(deadline.replace('Z', '+00:00')))
            except ValueError:
                return Response({"error": "Invalid deadline format"}, status=status.HTTP_400_BAD_REQUEST)
        
        started_date = None
        if started_at:
            try:
                started_date = timezone.make_aware(datetime.fromisoformat(started_at.replace('Z', '+00:00')))
            except ValueError:
                return Response({"error": "Invalid started_at format"}, status=status.HTTP_400_BAD_REQUEST)
        
        completed_date = None
        if completed_at:
            try:
                completed_date = timezone.make_aware(datetime.fromisoformat(completed_at.replace('Z', '+00:00')))
            except ValueError:
                return Response({"error": "Invalid completed_at format"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Convert string history_id to UUID
            try:
                history_id_uuid = uuid.UUID(history_id)
            except ValueError:
                return Response({"error": "Invalid history_id format"}, status=status.HTTP_400_BAD_REQUEST)
            
            history = update_history_dates(
                history_id_uuid,
                deadline=deadline_date,
                started_at=started_date,
                completed_at=completed_date
            )
            
            # Create response data
            response_data = {
                "success": True,
                "history_id": str(history.history_id),
                "updated": []
            }
            
            if deadline_date:
                response_data["updated"].append("deadline")
                response_data["deadline"] = deadline_date.isoformat()
            
            if started_date:
                response_data["updated"].append("started_at")
                response_data["started_at"] = started_date.isoformat()
            
            if completed_date:
                response_data["updated"].append("completed_at")
                response_data["completed_at"] = completed_date.isoformat()
                
            return Response(response_data)
            
        except History.DoesNotExist:
            return Response({"error": f"History with ID {history_id} not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def set_deadline(self, request):
        """
        Set deadline for an entity
        """
        entity_type = request.data.get('entity_type')
        entity_id = request.data.get('entity_id')
        deadline = request.data.get('deadline')
        
        if not all([entity_type, entity_id, deadline]):
            return Response({
                "error": "entity_type, entity_id, and deadline are required"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Parse deadline
        try:
            deadline_date = timezone.make_aware(datetime.fromisoformat(deadline.replace('Z', '+00:00')))
        except ValueError:
            return Response({"error": "Invalid deadline format"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Get entity based on type
            entity = None
            if entity_type.lower() == 'phase':
                entity = Phase.objects.get(id=entity_id)
            elif entity_type.lower() == 'output':
                entity = Output.objects.get(id=entity_id)
            else:
                return Response({
                    "error": f"Unsupported entity_type: {entity_type}"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            result = set_entity_deadline(entity, deadline_date, entity_type.lower())
            
            return Response({
                "success": True,
                "entity_type": entity_type,
                "entity_id": entity_id,
                "deadline": deadline_date.isoformat()
            })
            
        except (Phase.DoesNotExist, Output.DoesNotExist):
            return Response({
                "error": f"{entity_type} with ID {entity_id} not found"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def get_deadline(self, request):
        """
        Get deadline for an entity
        """
        entity_type = request.query_params.get('entity_type')
        entity_id = request.query_params.get('entity_id')
        
        if not all([entity_type, entity_id]):
            return Response({
                "error": "entity_type and entity_id are required"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Get entity based on type
            entity = None
            if entity_type.lower() == 'phase':
                entity = Phase.objects.get(id=entity_id)
            elif entity_type.lower() == 'output':
                entity = Output.objects.get(id=entity_id)
            else:
                return Response({
                    "error": f"Unsupported entity_type: {entity_type}"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            deadline = get_entity_deadline(entity, entity_type.lower())
            
            return Response({
                "entity_type": entity_type,
                "entity_id": entity_id,
                "deadline": deadline.isoformat() if deadline else None,
                "has_deadline": deadline is not None
            })
            
        except (Phase.DoesNotExist, Output.DoesNotExist):
            return Response({
                "error": f"{entity_type} with ID {entity_id} not found"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    @transaction.atomic
    def bulk_set_deadlines(self, request):
        """
        Set deadlines for multiple entities of the same type
        """
        entity_type = request.data.get('entity_type')
        entity_ids = request.data.get('entity_ids')
        deadline = request.data.get('deadline')
        
        if not all([entity_type, entity_ids, deadline]):
            return Response({
                "error": "entity_type, entity_ids, and deadline are required"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not isinstance(entity_ids, list):
            return Response({
                "error": "entity_ids must be a list"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Parse deadline
        try:
            deadline_date = timezone.make_aware(datetime.fromisoformat(deadline.replace('Z', '+00:00')))
        except ValueError:
            return Response({"error": "Invalid deadline format"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Get entity class based on type
            entity_class = None
            if entity_type.lower() == 'phase':
                entity_class = Phase
            elif entity_type.lower() == 'output':
                entity_class = Output
            else:
                return Response({
                    "error": f"Unsupported entity_type: {entity_type}"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            result = bulk_update_entity_deadlines(
                entity_ids,
                deadline_date,
                entity_class,
                entity_type.lower()
            )
            
            return Response({
                "success": True,
                "entity_type": entity_type,
                "updated_count": result['updated_count'],
                "failed_count": result['failed_count'],
                "total": result['total'],
                "deadline": deadline_date.isoformat(),
                "updated_entities": result['updated_entities']
            })
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)