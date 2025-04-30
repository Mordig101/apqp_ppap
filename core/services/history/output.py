# Output history tracking
from core.models import History, Output
from core.services.history.initialization import initialize_history

def record_output_creation(output):
    """
    Record output creation in history
    """
    initialize_history(
        title=f"{output.template.name} for Phase {output.phase_id}",
        event=f"Output created based on template {output.template.id}",
        table_name='output',
        history_id=output.history_id
    )

def record_output_update(output, updated_fields):
    """
    Record output update in history
    """
    initialize_history(
        title=f"{output.template.name} for Phase {output.phase_id}",
        event=f"Output updated: {', '.join(updated_fields)}",
        table_name='output',
        history_id=output.history_id
    )

def record_output_status_change(output, old_status, new_status):
    """
    Record output status change in history
    """
    initialize_history(
        title=f"{output.template.name} for Phase {output.phase_id}",
        event=f"Output status changed from {old_status} to {new_status}",
        table_name='output',
        history_id=output.history_id
    )

def record_output_document_upload(output, document):
    """
    Record document upload for an output
    """
    initialize_history(
        title=f"{output.template.name} for Phase {output.phase_id}",
        event=f"Document '{document.name}' (version {document.version}) uploaded",
        table_name='output',
        history_id=output.history_id
    )

def record_output_responsibility_change(output, old_user_id, new_user_id):
    """
    Record responsibility change for an output
    """
    old_username = "None" if not old_user_id else f"User {old_user_id}"
    new_username = "None" if not new_user_id else f"User {new_user_id}"
    
    initialize_history(
        title=f"{output.template.name} for Phase {output.phase_id}",
        event=f"Responsibility changed from {old_username} to {new_username}",
        table_name='output',
        history_id=output.history_id
    )

def record_output_deletion(output):
    """
    Record output deletion in history
    """
    initialize_history(
        title=f"{output.template.name} for Phase {output.phase_id}",
        event=f"Output deleted with ID {output.id}",
        table_name='output',
        history_id=output.history_id
    )

def record_output_review(output, review_status, comments=None):
    """
    Record output review in history
    """
    event = f"Output reviewed with status: {review_status}"
    if comments:
        event += f", Comments: {comments}"
    
    initialize_history(
        title=f"{output.template.name} for Phase {output.phase_id}",
        event=event,
        table_name='output',
        history_id=output.history_id
    )

def get_output_history(output_id):
    """
    Get complete history for an output
    """
    output = Output.objects.get(id=output_id)
    history_records = History.objects.filter(id=output.history_id).order_by('-created_at')
    return history_records
