from core.models import Todo, Person, Output
from django.utils import timezone

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
