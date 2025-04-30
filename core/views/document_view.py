from rest_framework import viewsets, status
from rest_framework.response import Response
from django.db import transaction
from core.models import Document
from core.serializers.document_serializer import DocumentSerializer
from core.services.history.initialization import initialize_history

class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        # Extract data
        name = request.data.get('name')
        description = request.data.get('description', '')
        output_id = request.data.get('output_id')
        file_type = request.data.get('file_type')
        file_content = request.data.get('file_content')  # Base64 encoded content
        
        # Validate required fields
        if not all([name, output_id, file_type, file_content]):
            return Response(
                {"error": "Missing required fields: name, output_id, file_type, file_content"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # TODO: Handle file storage (simplified for this implementation)
        file_path = f"documents/{name}.{file_type}"
        file_size = len(file_content)
        
        # Create document
        try:
            document = Document.objects.create(
                name=name,
                description=description,
                file_path=file_path,
                file_type=file_type,
                file_size=file_size,
                uploader_id=request.user.id,
                output_id=output_id,
                version="1.0",
                status="Draft"
            )
            
            # Record in history
            initialize_history(
                title=name,
                event=f"Document uploaded for Output {output_id}",
                table_name='document',
                history_id=document.history_id
            )
            
            serializer = self.get_serializer(document)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
