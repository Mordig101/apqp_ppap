# Document history tracking
from core.models import History, Document
from core.services.history.initialization import initialize_history

def record_document_creation(document):
    """
    Record document creation in history
    """
    initialize_history(
        title=document.name,
        event=f"Document created for Output {document.output_id}",
        table_name='document',
        history_id=document.history_id
    )

def record_document_update(document, updated_fields):
    """
    Record document update in history
    """
    initialize_history(
        title=document.name,
        event=f"Document updated: {', '.join(updated_fields)}",
        table_name='document',
        history_id=document.history_id
    )

def record_document_version_change(document, old_version, new_version):
    """
    Record document version change in history
    """
    initialize_history(
        title=document.name,
        event=f"Document version changed from {old_version} to {new_version}",
        table_name='document',
        history_id=document.history_id
    )

def record_document_status_change(document, old_status, new_status):
    """
    Record document status change in history
    """
    initialize_history(
        title=document.name,
        event=f"Document status changed from {old_status} to {new_status}",
        table_name='document',
        history_id=document.history_id
    )

def record_document_deletion(document):
    """
    Record document deletion in history
    """
    initialize_history(
        title=document.name,
        event=f"Document deleted with ID {document.id}",
        table_name='document',
        history_id=document.history_id
    )

def get_document_history(document_id):
    """
    Get complete history for a document
    """
    document = Document.objects.get(id=document_id)
    history_records = History.objects.filter(id=document.history_id).order_by('-created_at')
    return history_records
