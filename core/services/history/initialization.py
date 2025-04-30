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
    
    Args:
        title (str): Title for the history event
        event (str): Description of what happened
        table_name (str): The table this history record relates to
        history_id (str): The history_id of the parent object (not the primary key of the history record)
    """
    # Use history_id as the relationship ID, but create a unique ID for each history record
    unique_id = f"{uuid.uuid4().hex}"
    
    if not history_id:
        # If no history_id provided, create a new one for the object
        history_id = generate_history_id(table_name)
    
    # Store the history_id to maintain relationship, but use unique_id as the primary key
    history = History.objects.create(
        id=unique_id,
        history_id=history_id,  # This will be a new field we need to add
        title=title,
        event=event,
        table_name=table_name
    )
    
    return history
