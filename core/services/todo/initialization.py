from core.models import Todo

def initialize_todo(title, assigned_to, description='', output=None, priority='medium'):
    """
    Initialize a new todo
    
    Args:
        title (str): Todo title
        assigned_to (Person): Person assigned to the todo
        description (str, optional): Todo description
        output (Output, optional): Associated output
        priority (str, optional): Todo priority (low, medium, high)
        
    Returns:
        Todo: The created todo
    """
    todo = Todo.objects.create(
        title=title,
        description=description,
        assigned_to=assigned_to,
        output=output,
        priority=priority,
        status='pending'
    )
    
    return todo
