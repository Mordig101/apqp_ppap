from core.models import Todo
from core.services.history.todo import record_todo_creation

def initialize_todo(user_id, output_id, permission_name='r', role='contributor', history_attrs=None):
    """
    Initialize a new todo with history support
    
    Args:
        user_id (int): User ID
        output_id (int): Output ID
        permission_name (str): Permission name (default: 'r' for read)
        role (str): User role (default: 'contributor')
        history_attrs (dict, optional): History attributes
            - title: Custom history title
            - deadline: Deadline date (ISO format string)
            - started_at: Start date (ISO format string)
            - finished_at: Completion date (ISO format string)
        
    Returns:
        Todo: The created todo
    """
    # Get the required models
    from core.models import User, Output, Permission
    
    user = User.objects.get(id=user_id)
    output = Output.objects.get(id=output_id)
    permission = Permission.objects.get(name=permission_name)
    
    # Create the todo
    todo = Todo.objects.create(
        user=user,
        output=output,
        permission=permission,
        role=role
    )
    
    # Record creation in history
    history = record_todo_creation(todo)
    
    # Update history attributes if provided
    if history and history_attrs and isinstance(history_attrs, dict):
        from core.services.history.initialization import update_history_attributes
        update_history_attributes(
            history, 
            history_attrs, 
            auto_update_related_model=False,
            related_model=todo
        )
    
    return todo
