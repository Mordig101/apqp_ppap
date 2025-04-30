# Define all API here
from core.services.document.initialization import initialize_document
from core.services.document.functions import (
    update_document,
    delete_document,
    get_document_details,
    get_documents_by_output,
    get_documents_by_uploader,
    get_documents_by_status
)

# Export all functions for use in views
__all__ = [
    'initialize_document',
    'update_document',
    'delete_document',
    'get_document_details',
    'get_documents_by_output',
    'get_documents_by_uploader',
    'get_documents_by_status'
]
