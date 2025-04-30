import uuid
from django.db import transaction
from core.models import Document
from core.services.history.initialization import initialize_history

@transaction.atomic
def initialize_document(name, description, file_path, file_type, file_size, uploader_id, output_id, version="1.0", status="Draft"):
    """
    Initialize a new document
    """
    # Generate history ID
    history_id = f"{uuid.uuid4().hex}document"
    
    # Create document record
    document = Document.objects.create(
        name=name,
        description=description,
        file_path=file_path,
        file_type=file_type,
        file_size=file_size,
        uploader_id=uploader_id,
        output_id=output_id,
        version=version,
        status=status,
        history_id=history_id
    )
    
    # Initialize history record
    initialize_history(
        title=name,
        event=f"Document created for Output {output_id}",
        table_name='document',
        history_id=history_id
    )
    
    return document
