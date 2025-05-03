# Document service API
from core.services.document.initialization import initialize_document
from core.services.document.functions import (
    get_document_by_id,
    get_documents_by_output,
    get_documents_by_status,
    update_document,
    update_document_file,
    delete_document,
    change_document_output
)

# Export all functions for use in views
__all__ = [
    # Initialization
    'initialize_document',
    
    # Functions
    'get_document_by_id',
    'get_documents_by_output',
    'get_documents_by_status',
    'update_document',
    'update_document_file',
    'delete_document',
    'change_document_output'
]
