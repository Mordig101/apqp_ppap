# Define project possible action and services
from django.db import transaction
from core.models import Output, Document
from core.services.history.api import (
    record_output_update,
    record_output_status_change
)

@transaction.atomic
def update_output(output_id, data):
    """
    Update output details
    """
    output = Output.objects.get(id=output_id)
    
    # Check for status change
    old_status = output.status
    new_status = data.get('status', old_status)
    
    # Update fields
    updated_fields = []
    for field, value in data.items():
        if hasattr(output, field) and getattr(output, field) != value:
            setattr(output, field, value)
            updated_fields.append(field)
    
    if updated_fields:
        output.save()
        record_output_update(output, updated_fields)
    
    # Handle status change
    if 'status' in updated_fields and old_status != new_status:
        record_output_status_change(output, old_status, new_status)
        
        # Update phase status if needed
        update_phase_status_from_output(output)
    
    return output

def update_phase_status_from_output(output):
    """
    Update phase status based on output status changes
    """
    phase = output.phase
    
    # Get all outputs for this phase
    outputs = phase.outputs.all()
    
    # Check if all outputs are completed
    all_completed = all(o.status == 'Completed' for o in outputs)
    
    if all_completed and phase.status != 'Completed':
        phase.status = 'Completed'
        phase.save()
        
        # Record phase completion in history
        from core.services.history.initialization import initialize_history
        initialize_history(
            title=f"{phase.template.name}",
            event=f"Phase marked as Completed as all outputs are completed",
            table_name='phase',
            history_id=phase.history_id
        )
        
        # Update PPAP status
        from core.services.phase.functions import update_ppap_status_from_phase
        update_ppap_status_from_phase(phase)
    
    # Check if any output is in progress
    any_in_progress = any(o.status == 'In Progress' for o in outputs)
    
    if any_in_progress and phase.status == 'Not Started':
        phase.status = 'In Progress'
        phase.save()
        
        # Record phase status change in history
        from core.services.history.initialization import initialize_history
        initialize_history(
            title=f"{phase.template.name}",
            event=f"Phase marked as In Progress as at least one output is in progress",
            table_name='phase',
            history_id=phase.history_id
        )

@transaction.atomic
def add_document_to_output(output_id, document_data, uploader_id):
    """
    Add a document to an output
    """
    output = Output.objects.get(id=output_id)
    
    # Create document
    document = Document.objects.create(
        name=document_data['name'],
        description=document_data.get('description', ''),
        file_path=document_data['file_path'],
        file_type=document_data['file_type'],
        file_size=document_data['file_size'],
        uploader_id=uploader_id,
        output=output,
        version=document_data.get('version', '1.0'),
        status=document_data.get('status', 'Draft'),
        history_id=f"{uuid.uuid4().hex}document"
    )
    
    # Record document creation in history
    from core.services.history.initialization import initialize_history
    initialize_history(
        title=document.name,
        event=f"Document uploaded for Output {output_id}",
        table_name='document',
        history_id=document.history_id
    )
    
    return document

def get_output_details(output_id):
    """
    Get comprehensive output details including all documents
    """
    output = Output.objects.get(id=output_id)
    
    # Get documents
    documents = output.documents.all()
    
    document_details = []
    for doc in documents:
        document_details.append({
            'id': doc.id,
            'name': doc.name,
            'description': doc.description,
            'file_path': doc.file_path,
            'file_type': doc.file_type,
            'file_size': doc.file_size,
            'uploader': doc.uploader.username if doc.uploader else None,
            'version': doc.version,
            'status': doc.status
        })
    
    # Compile output details
    output_details = {
        'id': output.id,
        'name': output.template.name,
        'description': output.description,
        'status': output.status,
        'responsible': output.user.username if output.user else None,
        'phase_id': output.phase_id,
        'documents': document_details
    }
    
    return output_details
