from core.models import Todo, User, Output, Permission
from django.utils import timezone
from django.db import transaction

def get_todo_by_id(todo_id):
    """
    Get todo by ID
    
    Args:
        todo_id (int): Todo ID
        
    Returns:
        Todo: The todo object
        
    Raises:
        Todo.DoesNotExist: If todo not found
    """
    return Todo.objects.get(id=todo_id)

def get_todos_by_person(person_id):
    """
    Get todos by assigned person
    
    Args:
        person_id (int): Person ID
        
    Returns:
        QuerySet: Todos assigned to the person
    """
    return Todo.objects.filter(assigned_to_id=person_id)

def get_todos_by_output(output_id):
    """
    Get todos by output
    
    Args:
        output_id (int): Output ID
        
    Returns:
        QuerySet: Todos for the given output
    """
    return Todo.objects.filter(output_id=output_id)

def get_todos_by_status(status):
    """
    Get todos by status
    
    Args:
        status (str): Todo status
        
    Returns:
        QuerySet: Todos with the given status
    """
    return Todo.objects.filter(status=status)

def update_todo_title(todo, title):
    """
    Update todo title
    
    Args:
        todo (Todo): Todo to update
        title (str): New title
        
    Returns:
        Todo: Updated todo
    """
    todo.title = title
    todo.save()
    return todo

def update_todo_description(todo, description):
    """
    Update todo description
    
    Args:
        todo (Todo): Todo to update
        description (str): New description
        
    Returns:
        Todo: Updated todo
    """
    todo.description = description
    todo.save()
    return todo

def update_todo_priority(todo, priority):
    """
    Update todo priority
    
    Args:
        todo (Todo): Todo to update
        priority (str): New priority
        
    Returns:
        Todo: Updated todo
    """
    todo.priority = priority
    todo.save()
    return todo

def update_todo_status(todo, status):
    """
    Update todo status
    
    Args:
        todo (Todo): Todo to update
        status (str): New status
        
    Returns:
        Todo: Updated todo
    """
    todo.status = status
    
    # Set completion date if status is 'completed'
    if status == 'completed':
        todo.completed_at = timezone.now()
    else:
        todo.completed_at = None
    
    todo.save()
    return todo

def update_todo_assigned_to(todo, assigned_to):
    """
    Update todo assigned person
    
    Args:
        todo (Todo): Todo to update
        assigned_to (Person): New assigned person
        
    Returns:
        Todo: Updated todo
    """
    todo.assigned_to = assigned_to
    todo.save()
    return todo

def delete_todo(todo):
    """
    Delete a todo
    
    Args:
        todo: Todo object
    """
    todo.delete()

@transaction.atomic
def update_todo(todo, user_id=None, output_id=None, permission_name=None, role=None, history_attrs=None):
    """
    Update todo attributes with history tracking
    
    Args:
        todo: Todo object to update
        user_id: New user ID (optional)
        output_id: New output ID (optional)
        permission_name: New permission name (optional)
        role: New role (optional)
        history_attrs: Dictionary with history attributes (optional)
            - title: Custom history title
            - deadline: Deadline date (ISO format string)
            - started_at: Start date (ISO format string)
            - finished_at: Completion date (ISO format string)
            
    Returns:
        Todo: Updated todo
    """
    from core.services.history.todo import record_todo_update
    
    # Track updated fields
    updated_fields = []
    
    # Update user if provided
    if user_id is not None:
        from core.models import User
        user = User.objects.get(id=user_id)
        if todo.user != user:
            todo.user = user
            updated_fields.append('user')
    
    # Update output if provided
    if output_id is not None:
        from core.models import Output
        output = Output.objects.get(id=output_id)
        if todo.output != output:
            todo.output = output
            updated_fields.append('output')
    
    # Update permission if provided
    if permission_name is not None:
        from core.models import Permission
        permission = Permission.objects.get(name=permission_name)
        if todo.permission != permission:
            todo.permission = permission
            updated_fields.append('permission')
    
    # Update role if provided
    if role is not None and todo.role != role:
        todo.role = role
        updated_fields.append('role')
    
    # Save todo if any fields were updated
    if updated_fields:
        todo.save(update_fields=updated_fields)
        record_todo_update(todo, updated_fields)
    
    # Update history attributes if provided
    if history_attrs and isinstance(history_attrs, dict):
        from core.services.history.initialization import update_history_attributes
        from core.services.history.todo import get_todo_history
        history = get_todo_history(todo.id)
        if history:
            update_history_attributes(
                history, 
                history_attrs, 
                auto_update_related_model=False,
                related_model=todo
            )
    
    return todo

@transaction.atomic
def update_todo_role(todo, role):
    """
    Update todo role with history tracking
    
    Args:
        todo: Todo object to update
        role: New role
            
    Returns:
        Todo: Updated todo
    """
    from core.services.history.todo import record_todo_role_change
    
    if todo.role != role:
        old_role = todo.role
        todo.role = role
        todo.save(update_fields=['role'])
        record_todo_role_change(todo, old_role, role)
    
    return todo

@transaction.atomic
def update_todo_history(todo_id, history_attrs):
    """
    Update history attributes for a todo
    
    Args:
        todo_id: ID of the todo
        history_attrs: Dictionary with history attributes
            - title: Custom history title
            - deadline: Deadline date (ISO format string)
            - started_at: Start date (ISO format string)
            - finished_at: Completion date (ISO format string)
    
    Returns:
        History: Updated history record or None if not found
    """
    from core.models import Todo
    from core.services.history.todo import get_todo_history
    from core.services.history.initialization import update_history_attributes
    
    # Get todo
    todo = Todo.objects.get(id=todo_id)
    
    # Get history record
    history = get_todo_history(todo_id)
    
    if not history:
        return None
    
    # Update history attributes
    updated_history, _ = update_history_attributes(
        history=history,
        attributes=history_attrs,
        auto_update_related_model=False,
        related_model=todo
    )
    
    return updated_history
