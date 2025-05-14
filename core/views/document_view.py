from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction
from core.models import Document, Output, User, History
from core.serializers.document_serializer import DocumentSerializer
from core.serializers.history_serializer import HistorySerializer
from core.services.document.api import (
    initialize_document,
    update_document,
    update_document_file,
    delete_document,
    change_document_output,
    get_documents_by_output,
    get_documents_by_status
)
from core.services.history.document import record_document_creation
import uuid

class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        # Extract document data
        name = request.data.get('name')
        uploaded_file = request.FILES.get('file')  # Get the actual uploaded file
        output_id = request.data.get('output_id')
        uploader_id = request.data.get('uploader')
        version = request.data.get('version', '1.0')
        status_value = request.data.get('status', 'Draft')
        
        # Extract history attributes
        history_attrs = {}
        if 'history' in request.data:
            try:
                if isinstance(request.data['history'], dict):
                    history_data = request.data['history']
                else:
                    # Try to parse JSON string
                    import json
                    history_data = json.loads(request.data['history'])
                    
                if 'title' in history_data:
                    history_attrs['title'] = history_data['title']
                if 'deadline' in history_data:
                    history_attrs['deadline'] = history_data['deadline']
                if 'started_at' in history_data:
                    history_attrs['started_at'] = history_data['started_at']
                if 'finished_at' in history_data:
                    history_attrs['finished_at'] = history_data['finished_at']
            except (json.JSONDecodeError, TypeError, ValueError):
                return Response(
                    {"error": "Invalid history data format"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Validate required fields
        if not name or not uploaded_file:
            return Response(
                {"error": "Missing required fields: name, file"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Get output if provided
            output = None
            if output_id:
                try:
                    output = Output.objects.get(id=output_id)
                except Output.DoesNotExist:
                    return Response(
                        {"error": f"Output with ID {output_id} not found"},
                        status=status.HTTP_404_NOT_FOUND
                    )
                    
            # Get uploader user
            uploader = None
            if uploader_id:
                try:
                    uploader = User.objects.get(id=uploader_id)
                except User.DoesNotExist:
                    return Response(
                        {"error": f"User with ID {uploader_id} not found"},
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            # Save the uploaded file
            file_path = self._save_uploaded_file(uploaded_file)
            
            # Create document with history attributes
            document = initialize_document(
                name=name,
                file_path=file_path,
                output=output,
                uploader=uploader,
                status=status_value,
                version=version,
                history_attrs=history_attrs if history_attrs else None
            )
            
            serializer = self.get_serializer(document)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def _save_uploaded_file(self, file):
        """
        Save an uploaded file to the appropriate location
        
        Args:
            file: The uploaded file object
        
        Returns:
            str: Path where the file was saved
        """
        import os
        from django.conf import settings
        
        # Create uploads directory if it doesn't exist
        upload_dir = os.path.join(settings.MEDIA_ROOT, 'uploads', 'documents')
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate a unique filename
        filename = f"{uuid.uuid4().hex}_{file.name}"
        file_path = os.path.join(upload_dir, filename)
        
        # Save the file
        with open(file_path, 'wb+') as destination:
            for chunk in file.chunks():
                destination.write(chunk)
        
        return file_path

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        document = self.get_object()
        
        # Extract document data
        name = request.data.get('name')
        description = request.data.get('description')
        status_value = request.data.get('status')
        version = request.data.get('version')
        
        # Extract history attributes
        history_attrs = {}
        if 'history' in request.data:
            try:
                if isinstance(request.data['history'], dict):
                    history_data = request.data['history']
                else:
                    # Try to parse JSON string
                    import json
                    history_data = json.loads(request.data['history'])
                    
                if 'title' in history_data:
                    history_attrs['title'] = history_data['title']
                if 'deadline' in history_data:
                    history_attrs['deadline'] = history_data['deadline']
                if 'started_at' in history_data:
                    history_attrs['started_at'] = history_data['started_at']
                if 'finished_at' in history_data:
                    history_attrs['finished_at'] = history_data['finished_at']
            except (json.JSONDecodeError, TypeError, ValueError):
                return Response(
                    {"error": "Invalid history data format"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        try:
            # Update document with all provided attributes
            updated_document = update_document(
                document=document,
                name=name,
                description=description,
                status=status_value,
                version=version,
                history_attrs=history_attrs if history_attrs else None
            )
            
            serializer = self.get_serializer(updated_document)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        document = self.get_object()
        delete_file = request.query_params.get('delete_file', 'true').lower() == 'true'
        
        try:
            # Delete document
            delete_document(document, delete_file=delete_file)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def update_file(self, request, pk=None):
        document = self.get_object()
        new_file_path = request.data.get('file_path')
        
        if not new_file_path:
            return Response(
                {"error": "Missing required field: file_path"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            updated_document = update_document_file(document, new_file_path)
            serializer = self.get_serializer(updated_document)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def change_output(self, request, pk=None):
        document = self.get_object()
        output_id = request.data.get('output_id')
        
        if not output_id:
            return Response(
                {"error": "Missing required field: output_id"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            output = Output.objects.get(id=output_id)
            updated_document = change_document_output(document, output)
            serializer = self.get_serializer(updated_document)
            return Response(serializer.data)
        except Output.DoesNotExist:
            return Response(
                {"error": f"Output with ID {output_id} not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def by_output(self, request):
        output_id = request.query_params.get('output_id')
        
        if not output_id:
            return Response(
                {"error": "Missing required parameter: output_id"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            documents = get_documents_by_output(output_id)
            serializer = self.get_serializer(documents, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def by_status(self, request):
        status_value = request.query_params.get('status')
        
        if not status_value:
            return Response(
                {"error": "Missing required parameter: status"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            documents = get_documents_by_status(status_value)
            serializer = self.get_serializer(documents, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['put'])
    def update_history(self, request, pk=None):
        """Update only history attributes for this document"""
        document = self.get_object()
        
        # Extract history attributes
        history_attrs = {}
        if 'title' in request.data:
            history_attrs['title'] = request.data.get('title')
        if 'deadline' in request.data:
            history_attrs['deadline'] = request.data.get('deadline')
        if 'started_at' in request.data:
            history_attrs['started_at'] = request.data.get('started_at')
        if 'finished_at' in request.data:
            history_attrs['finished_at'] = request.data.get('finished_at')
        
        try:
            # Update history
            from core.services.document.functions import update_document_history
            history = update_document_history(pk, history_attrs)
            
            if not history:
                return Response(
                    {'error': 'History record not found for this document'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Return updated history
            serializer = HistorySerializer(history)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """Get history details for this document"""
        document = self.get_object()
        
        try:
            # Get document history
            from core.models import History
            
            if not document.history_id:
                return Response(
                    {'error': 'No history found for this document'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            history_records = History.objects.filter(id=document.history_id)
            if not history_records.exists():
                return Response(
                    {'error': 'History record not found for this document'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            serializer = HistorySerializer(history_records, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
