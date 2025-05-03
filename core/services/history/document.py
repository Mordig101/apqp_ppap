# Document history tracking
from core.models import Document
from django.utils import timezone
from core.services.history.initialization import (
    get_history, initialize_history, add_history_event, ensure_history_id
)

def record_document_creation(document):
    """
    Record document creation in history
    
    Args:
        document (Document): Created document
        
    Returns:
        History: Created history record
    """
    # Ensure document has a history_id
    ensure_history_id(document)
    
    # Initialize a new history record
    history = initialize_history(
        title=document.name,
        event_type="create",
        event_details=f"Document created for Output {document.output_id}",
        table_name='document',
        history_id=document.history_id
    )
    
    return history

def record_document_update(document, updated_fields):
    """
    Record document update in history
    
    Args:
        document (Document): Updated document
        updated_fields (list): List of fields that were updated
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(document)
    
    if not history:
        return None
    
    # Make sure title stays updated with current name
    history.title = document.name
    history.save(update_fields=['title'])
    
    # Add update event
    event_details = f"Document updated: {', '.join(updated_fields)}"
    
    return add_history_event(history, "update", event_details)

def record_document_name_change(document, old_name, new_name):
    """
    Record document name change in history
    
    Args:
        document (Document): Document object
        old_name (str): Previous document name
        new_name (str): New document name
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(document)
    
    if not history:
        return None
    
    # Update the title to reflect the new name
    history.title = new_name
    history.save(update_fields=['title'])
    
    # Add name change event
    event_details = f"Document name changed from '{old_name}' to '{new_name}'"
    
    return add_history_event(history, "name_change", event_details)

def record_document_version_change(document, old_version, new_version):
    """
    Record document version change in history
    
    Args:
        document (Document): Document object
        old_version: Previous version number
        new_version: New version number
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(document)
    
    if not history:
        return None
    
    # Add version change event
    event_details = f"Document version changed from {old_version} to {new_version}"
    
    return add_history_event(history, "version_change", event_details)

def record_document_status_change(document, old_status, new_status):
    """
    Record document status change in history
    
    Args:
        document (Document): Document object
        old_status: Previous status
        new_status: New status
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(document)
    
    if not history:
        return None
    
    # Add status change event
    event_details = f"Document status changed from '{old_status}' to '{new_status}'"
    
    # Determine event type based on status
    event_type = "status_change"
    if new_status.lower() in ['completed', 'approved', 'finalized']:
        event_type = "complete"
    elif new_status.lower() in ['draft', 'in_progress']:
        event_type = "in_progress"
    elif new_status.lower() in ['review', 'reviewing']:
        event_type = "review"
        
    return add_history_event(history, event_type, event_details)

def record_document_file_change(document, old_file_path, new_file_path):
    """
    Record document file change in history
    
    Args:
        document (Document): Document object
        old_file_path: Previous file path
        new_file_path: New file path
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(document)
    
    if not history:
        return None
    
    # Add file change event
    event_details = f"Document file updated"
    
    return add_history_event(history, "file_change", event_details)

def record_document_review(document, reviewer_id, status, comments=None):
    """
    Record document review in history
    
    Args:
        document (Document): Document object
        reviewer_id: ID of the reviewer
        status: Review status (approved, rejected, etc.)
        comments: Optional review comments
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(document)
    
    if not history:
        return None
    
    # Add review event
    event_details = f"Document reviewed by User {reviewer_id} with status: {status}"
    if comments:
        event_details += f". Comments: {comments}"
    
    # Determine event type based on review status
    event_type = "review"
    if status.lower() in ['approved', 'accepted']:
        event_type = "approve"
    elif status.lower() in ['rejected', 'denied']:
        event_type = "reject"
        
    return add_history_event(history, event_type, event_details)

def record_document_deletion(document):
    """
    Record document deletion in history
    
    Args:
        document (Document): Document object being deleted
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(document)
    
    if not history:
        return None
    
    # Add deletion event
    event_details = f"Document deleted with ID {document.id}"
    
    return add_history_event(history, "delete", event_details)

def get_document_history(document_id):
    """
    Get history record for a document
    
    Args:
        document_id: Document ID
    
    Returns:
        History or None: Document history record if found, None otherwise
    """
    try:
        document = Document.objects.get(id=document_id)
        return get_history(document)
    except Document.DoesNotExist:
        return None
