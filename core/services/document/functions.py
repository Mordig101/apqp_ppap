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

def update_document(document, name=None, description=None, status=None, version=None, history_attrs=None):
    """
    Update document information with history attributes
    
    Args:
        document: Document object
        name (str): New name (if None, keep existing)
        description (str): New description (if None, keep existing)
        status (str): New status (if None, keep existing)
        version (str): New version (if None, keep existing)
        history_attrs (dict, optional): Dictionary with history attributes
            - title: Custom history title
            - deadline: Deadline date (ISO format string)
            - started_at: Start date (ISO format string)
            - finished_at: Completion date (ISO format string)
    
    Returns:
        Document: The updated document
    """
    from core.services.history.document import get_document_history
    from core.services.history.initialization import update_history_attributes
    
    updated_fields = []
    
    if name is not None and name != document.name:
        old_name = document.name
        document.name = name
        updated_fields.append('name')
        # Add specific name change record if you have a function for it
        # record_document_name_change(document, old_name, name)
    
    if description is not None and description != document.description:
        document.description = description
        updated_fields.append('description')
    
    if status is not None and status != document.status:
        old_status = document.status
        document.status = status
        updated_fields.append('status')
        record_document_status_change(document, old_status, status)
    
    if version is not None and version != document.version:
        old_version = document.version
        document.version = version
        updated_fields.append('version')
        record_document_version_change(document, old_version, version)
    
    if updated_fields:
        document.save(update_fields=updated_fields)
        record_document_update(document, updated_fields)
    
    # Update history attributes if provided
    if history_attrs and isinstance(history_attrs, dict):
        history = get_document_history(document.id)
        if history:
            update_history_attributes(
                history, 
                history_attrs, 
                auto_update_related_model=False,  # Don't auto-update status based on dates
                related_model=document
            )
    
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
    
    document.file_path = new_file_path
    document.file_name = file_name
    document.version = new_version
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
    )
    
    return document

def update_document_history(document_id, history_attrs):
    """
    Update history attributes for a document
    
    Args:
        document_id: ID of the document
        history_attrs: Dictionary with history attributes
            - title: Custom history title
            - deadline: Deadline date (ISO format string)
            - started_at: Start date (ISO format string)
            - finished_at: Completion date (ISO format string)
    
    Returns:
        History: Updated history record or None if not found
    """
    from core.services.history.document import get_document_history
    from core.services.history.initialization import update_history_attributes
    
    # Get document
    document = Document.objects.get(id=document_id)
    
    # Get history record
    history = get_document_history(document_id)
    
    if not history:
        return None
    
    # Use the generic history attribute update function
    updated_history, _ = update_history_attributes(
        history=history,
        attributes=history_attrs,
        auto_update_related_model=False,  # Don't auto-update status
        related_model=document
    )
    
    return updated_history

def get_document_history(document_id):
    """
    Get history record for a document
    
    Args:
        document_id: ID of the document
    
    Returns:
        History: The history record or None if not found
    """
    from core.services.history.document import get_document_history
    return get_document_history(document_id)
