# Define document possible actions and services
from django.db import transaction
from core.models import Document
from core.services.history.api import (
    record_document_update,
    record_document_version_change,
    record_document_status_change,
    record_document_deletion
)

@transaction.atomic
def update_document(document_id, data):
    """
    Update document details
    """
    document = Document.objects.get(id=document_id)
    
    # Check for version change
    old_version = document.version
    new_version = data.get('version', old_version)
    
    # Check for status change
    old_status = document.status
    new_status = data.get('status', old_status)
    
    # Update fields
    updated_fields = []
    for field, value in data.items():
        if hasattr(document, field) and getattr(document, field) != value:
            setattr(document, field, value)
            updated_fields.append(field)
    
    if updated_fields:
        document.save()
        record_document_update(document, updated_fields)
    
    # Handle version change
    if 'version' in updated_fields and old_version != new_version:
        record_document_version_change(document, old_version, new_version)
    
    # Handle status change
    if 'status' in updated_fields and old_status != new_status:
        record_document_status_change(document, old_status, new_status)
    
    return document

@transaction.atomic
def delete_document(document_id):
    """
    Delete a document
    """
    document = Document.objects.get(id=document_id)
    
    # Record deletion in history
    record_document_deletion(document)
    
    # Delete document
    document.delete()
    
    return True

def get_document_details(document_id):
    """
    Get comprehensive document details
    """
    document = Document.objects.get(id=document_id)
    
    # Get history records
    from core.services.history.document import get_document_history
    history_records = get_document_history(document_id)
    
    # Compile document details
    document_details = {
        'id': document.id,
        'name': document.name,
        'description': document.description,
        'file_path': document.file_path,
        'file_type': document.file_type,
        'file_size': document.file_size,
        'uploader': {
            'id': document.uploader.id,
            'username': document.uploader.username
        } if document.uploader else None,
        'output': {
            'id': document.output.id,
            'name': document.output.template.name
        },
        'version': document.version,
        'status': document.status,
        'history': [
            {
                'event': record.event,
                'created_at': record.created_at
            } for record in history_records
        ]
    }
    
    return document_details

def get_documents_by_output(output_id):
    """
    Get all documents for an output
    """
    documents = Document.objects.filter(output_id=output_id).order_by('-id')
    return documents

def get_documents_by_uploader(uploader_id):
    """
    Get all documents uploaded by a user
    """
    documents = Document.objects.filter(uploader_id=uploader_id).order_by('-id')
    return documents

def get_documents_by_status(status):
    """
    Get all documents with a specific status
    """
    documents = Document.objects.filter(status=status).order_by('-id')
    return documents
