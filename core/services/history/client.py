# Client history tracking
from core.models import History, Client
from core.services.history.initialization import initialize_history

def record_client_creation(client):
    """
    Record client creation in history
    """
    initialize_history(
        title=client.name,
        event=f"Client created with ID {client.id}",
        table_name='client',
        history_id=client.history_id
    )

def record_client_update(client, updated_fields):
    """
    Record client update in history
    """
    initialize_history(
        title=client.name,
        event=f"Client updated: {', '.join(updated_fields)}",
        table_name='client',
        history_id=client.history_id
    )

def record_client_deletion(client):
    """
    Record client deletion in history
    """
    initialize_history(
        title=client.name,
        event=f"Client deleted with ID {client.id}",
        table_name='client',
        history_id=client.history_id
    )

def get_client_history(client_id):
    """
    Get complete history for a client
    """
    client = Client.objects.get(id=client_id)
    history_records = History.objects.filter(id=client.history_id).order_by('-created_at')
    return history_records
