import uuid
from core.models import History

def generate_history_id(table_name):
    """
    Generate a unique history ID for a new record
    """
    return f"{uuid.uuid4().hex}{table_name}"

def initialize_history(title, event, table_name, history_id=None):
    """
    Initialize a history record
    """
    if not history_id:
        history_id = generate_history_id(table_name)
    
    history = History.objects.create(
        id=history_id,
        title=title,
        event=event,
        table_name=table_name
    )
    
    return history
