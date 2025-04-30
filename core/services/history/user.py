# User history tracking
from core.models import History, User
from core.services.history.initialization import initialize_history

def record_user_creation(user):
    """
    Record user creation in history
    """
    initialize_history(
        title=user.username,
        event=f"User created with ID {user.id}",
        table_name='user',
        history_id=user.history_id
    )

def record_user_update(user, updated_fields):
    """
    Record user update in history
    """
    initialize_history(
        title=user.username,
        event=f"User updated: {', '.join(updated_fields)}",
        table_name='user',
        history_id=user.history_id
    )

def record_user_login(user):
    """
    Record user login in history
    """
    initialize_history(
        title=user.username,
        event=f"User logged in at {user.last_login}",
        table_name='user',
        history_id=user.history_id
    )
