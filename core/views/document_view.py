from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction
from core.models import Document, Output
from core.serializers.document_serializer import DocumentSerializer
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

class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        # Extract document data
        name = request.data.get('name')
        file_path = request.data.get('file_path')
        output_id = request.data.get('output_id')
        version = request.data.get('version', 1)
        status_value = request.data.get('status', 'draft')
        
        # Validate required fields
        if not all([name, file_path]):
            return Response(
                {"error": "Missing required fields: name, file_path"},
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
            
            # Create document
            document = initialize_document(
                name=name,
                file_path=file_path,
                output=output,
                version=version,
                status=status_value
            )
            
            # Record in history
            record_document_creation(document)
            
            serializer = self.get_serializer(document)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @transaction.atomic
    def update(self, request, *args, **kwargs):
        document = self.get_object()
        
        # Extract document data
        name = request.data.get('name')
        status_value = request.data.get('status')
        
        try:
            # Update document
            updated_document = update_document(
                document=document,
                name=name,
                status=status_value
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
