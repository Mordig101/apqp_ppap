from core.models import Todo, User, Output, Permission, Person
from django.utils import timezone
from core.services.todo.initialization import initialize_todo
from core.services.todo.functions import (
    get_todo_by_id,
    get_todos_by_person,
    get_todos_by_output,
    get_todos_by_status,
    update_todo_title,
    update_todo_description,
    update_todo_priority,
    update_todo_status,
    update_todo_assigned_to
)
# Import the missing functions from logic.todo
from core.services.logic.todo import (
    create_todo,
    get_user_todos,
    get_pending_todos,
    assign_todos_for_phase
)

# Re-export the functions from functions.py
__all__ = [
    'initialize_todo',
    'get_todo_by_id',
    'get_todos_by_person',
    'get_todos_by_output',
    'get_todos_by_status',
    'update_todo_title',
    'update_todo_description',
    'update_todo_priority',
    'update_todo_status',
    'update_todo_assigned_to',
    'update_todo',
    'change_todo_status',
    'reassign_todo',
    'delete_todo',
    # Add the missing functions
    'create_todo',
    'get_user_todos',
    'get_pending_todos',
    'assign_todos_for_phase'
]

def update_todo(todo, title=None, description=None, priority=None):
    """
    Update multiple todo fields at once
    
    Args:
        todo (Todo): Todo to update
        title (str, optional): New title
        description (str, optional): New description
        priority (str, optional): New priority
        
    Returns:
        Todo: Updated todo
    """
    if title is not None:
        todo = update_todo_title(todo, title)
        
    if description is not None:
        todo = update_todo_description(todo, description)
        
    if priority is not None:
        todo = update_todo_priority(todo, priority)
        
    return todo

def change_todo_status(todo, status):
    """
    Change todo status
    
    Args:
        todo (Todo): Todo to update
        status (str): New status
        
    Returns:
        Todo: Updated todo
    """
    return update_todo_status(todo, status)

def reassign_todo(todo, person):
    """
    Reassign todo to another person
    
    Args:
        todo (Todo): Todo to update
        person (Person): New assigned person
        
    Returns:
        Todo: Updated todo
    """
    return update_todo_assigned_to(todo, person)

def delete_todo(todo):
    """
    Delete todo
    
    Args:
        todo (Todo): Todo to delete
    """
    todo.delete()
