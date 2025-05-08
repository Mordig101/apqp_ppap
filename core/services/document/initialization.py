import uuid
from core.models import Document, Output, History
from core.services.history.document import (
    record_document_creation,
    record_document_update,
    record_document_version_change,
    record_document_status_change,
    record_document_deletion
)
import os
import shutil
from django.utils import timezone

def initialize_document(name, file_path, output, uploader, status='draft', version=1, file_size=None, file_type=None):
    """
    Initialize a new document
    
    Args:
        name (str): Document name
        file_path (str): Path to the document file
        output (Output): Associated output
        uploader (User): User who uploaded the document
        status (str, optional): Document status, defaults to 'draft'
        version (int, optional): Document version, defaults to 1
        file_size (int, optional): Size of the file in bytes
        file_type (str, optional): Type/extension of the file
    
    Returns:
        Document: The created document
    """
    # Generate history ID
    history_id = f"{uuid.uuid4().hex}document"
    
    # If file_size wasn't provided and file_path is a local path, calculate it
    if file_size is None:
        if os.path.exists(file_path):
            file_size = os.path.getsize(file_path)
        else:
            file_size = 0  # Default value for non-local files or missing files
    
    # If file_type wasn't provided, try to determine it from the path
    if file_type is None and file_path:
        file_type = os.path.splitext(file_path)[1][1:].lower()
    
    # Create the document
    document = Document.objects.create(
        file_path=file_path,
        name=name,
        output=output,
        status=status,
        version=version,
        uploader=uploader,
        file_size=file_size,
        file_type=file_type or ""  # Ensure it's not NULL
    )
    
    # Record creation in history
    record_document_creation(document)
    
    return document

def get_document_by_id(document_id):
    """
    Get document by ID
    
    Args:
        document_id (int): Document ID
    
    Returns:
        Document: The document object
    """
    return Document.objects.get(id=document_id)

def get_documents_by_output(output_id):
    """
    Get documents for a specific output
    
    Args:
        output_id (int): Output ID
    
    Returns:
        QuerySet: Documents for the specified output
    """
    return Document.objects.filter(output_id=output_id)

def get_documents_by_status(status):
    """
    Get documents with a specific status
    
    Args:
        status (str): Document status
    
    Returns:
        QuerySet: Documents with the specified status
    """
    return Document.objects.filter(status=status)

def update_document(document, name=None, status=None):
    """
    Update document information
    
    Args:
        document: Document object
        name (str): New name (if None, keep existing)
        status (str): New status (if None, keep existing)
    
    Returns:
        Document: The updated document
    """
    updated_fields = []
    
    if name is not None and name != document.name:
        document.name = name
        updated_fields.append('name')
    
    if status is not None and status != document.status:
        old_status = document.status
        document.status = status
        updated_fields.append('status')
        record_document_status_change(document, old_status, status)
    
    if updated_fields:
        document.save()
        record_document_update(document, updated_fields)
    
    return document

def update_document_file(document, new_file_path):
    """
    Update document file (create new version)
    
    Args:
        document: Document object
        new_file_path: Path to the new file
    
    Returns:
        Document: The updated document
    """
    old_version = document.version
    new_version = old_version + 1
    
    # Extract file name from path
    file_name = os.path.basename(new_file_path)
    
    # Get new file size and type
    file_size = os.path.getsize(new_file_path) if os.path.exists(new_file_path) else 0
    file_type = os.path.splitext(new_file_path)[1][1:].lower() if new_file_path else ""
    
    document.file_path = new_file_path
    document.file_name = file_name
    document.version = new_version
    document.file_size = file_size  # Update file size
    document.file_type = file_type  # Update file type
    document.save()
    
    record_document_version_change(document, old_version, new_version)
    
    return document

def delete_document(document, delete_file=True):
    """
    Delete a document
    
    Args:
        document: Document object
        delete_file (bool): Whether to delete the physical file
    """
    record_document_deletion(document)
    
    # Delete physical file if requested
    if delete_file and document.file_path and os.path.exists(document.file_path):
        if os.path.isfile(document.file_path):
            os.remove(document.file_path)
        else:
            shutil.rmtree(document.file_path)
    
    document.delete()

def change_document_output(document, output):
    """
    Change the output associated with a document
    
    Args:
        document: Document object
        output: Output object
    
    Returns:
        Document: The updated document
    """
    old_output_id = document.output.id if document.output else None
    
    document.output = output
    document.save()
    
    History.objects.create(
        id=document.history_id,
        title=document.name,
        event=f"Document moved from output ID {old_output_id} to output ID {output.id}",
        table_name='document',
        timestamp=timezone.now()
    )
    
    return document
