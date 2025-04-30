# PPAP history tracking
from core.models import History, PPAP
from core.services.history.initialization import initialize_history

def record_ppap_creation(ppap):
    """
    Record PPAP creation in history
    """
    initialize_history(
        title=f"PPAP for Project {ppap.project_id}",
        event=f"PPAP created with level {ppap.level}",
        table_name='ppap',
        history_id=ppap.history_id
    )

def record_ppap_update(ppap, updated_fields):
    """
    Record PPAP update in history
    """
    initialize_history(
        title=f"PPAP for Project {ppap.project_id}",
        event=f"PPAP updated: {', '.join(updated_fields)}",
        table_name='ppap',
        history_id=ppap.history_id
    )

def record_ppap_level_change(ppap, old_level, new_level):
    """
    Record PPAP level change in history
    """
    initialize_history(
        title=f"PPAP for Project {ppap.project_id}",
        event=f"PPAP level changed from {old_level} to {new_level}",
        table_name='ppap',
        history_id=ppap.history_id
    )
