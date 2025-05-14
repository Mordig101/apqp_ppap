from django.utils import timezone

def record_todo_creation(todo):
    """
    Record the creation of a todo in history
    
    Args:
        todo: Todo object
        
    Returns:
        History: Created history record
    """
    from core.services.history.initialization import initialize_history
    
    table_name = 'todo'
    title = f"Todo for {todo.user.username} on output {todo.output_id}"
    event_type = "create"
    event_details = f"Todo created with ID {todo.id}"
    
    # Create history record
    history = initialize_history(
        title=title,
        event_type=event_type,
        event_details=event_details,
        table_name=table_name,
        history_id=todo.history_id
    )
    
    return history

def record_todo_update(todo, updated_fields):
    """
    Record an update to a todo in history
    
    Args:
        todo: Todo object
        updated_fields: List of updated fields
        
    Returns:
        History: Updated history record or None if no history found
    """
    from core.services.history.initialization import get_history, add_history_event
    
    # Get history record
    history = get_history(todo)
    if not history:
        return None
    
    # Record update
    event_type = "update"
    event_details = f"Todo updated: {', '.join(updated_fields)}"
    add_history_event(history, event_type, event_details)
    
    return history

def record_todo_role_change(todo, old_role, new_role):
    """
    Record a role change for a todo in history
    
    Args:
        todo: Todo object
        old_role: Old role name
        new_role: New role name
        
    Returns:
        History: Updated history record or None if no history found
    """
    from core.services.history.initialization import get_history, add_history_event
    
    # Get history record
    history = get_history(todo)
    if not history:
        return None
    
    # Get display names for roles
    roles_dict = dict(todo.ROLE_CHOICES)
    old_display = roles_dict.get(old_role, old_role)
    new_display = roles_dict.get(new_role, new_role)
    
    # Record role change
    event_type = "role_change"
    event_details = f"Todo role changed from '{old_display}' to '{new_display}'"
    add_history_event(history, event_type, event_details)
    
    return history

def record_todo_deletion(todo):
    """
    Record the deletion of a todo in history
    
    Args:
        todo: Todo object
        
    Returns:
        History: Updated history record or None if no history found
    """
    from core.services.history.initialization import get_history, add_history_event
    
    # Get history record
    history = get_history(todo)
    if not history:
        return None
    
    # Record deletion
    event_type = "delete"
    event_details = f"Todo deleted"
    add_history_event(history, event_type, event_details)
    
    return history

def get_todo_history(todo_id):
    """
    Get history record for a todo
    
    Args:
        todo_id: Todo ID
        
    Returns:
        History: Todo history record or None if not found
    """
    from core.models import Todo, History
    
    # Get todo history ID
    try:
        todo = Todo.objects.get(id=todo_id)
        if todo.history_id:
            return History.objects.get(id=todo.history_id)
    except (Todo.DoesNotExist, History.DoesNotExist):
        pass
    
    return None