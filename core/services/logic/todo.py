# To do logic
from core.models import Todo, User, Output, Permission
from django.db.models import Q

def create_todo(user_id, output_id, permission_name):
    """
    Create a todo for a user
    """
    user = User.objects.get(id=user_id)
    output = Output.objects.get(id=output_id)
    permission = Permission.objects.get(name=permission_name)
    
    todo = Todo.objects.create(
        user=user,
        output=output,
        permission=permission
    )
    
    return todo

def assign_todos_for_phase(phase_id, responsible_id):
    """
    Assign todos for all outputs in a phase to a responsible user
    """
    from core.models import Phase, Output
    
    phase = Phase.objects.get(id=phase_id)
    outputs = Output.objects.filter(phase=phase)
    
    # Get edit permission
    edit_permission = Permission.objects.get(name='e')
    
    todos = []
    for output in outputs:
        todo, created = Todo.objects.get_or_create(
            user_id=responsible_id,
            output=output,
            defaults={'permission': edit_permission}
        )
        todos.append(todo)
    
    # Update phase responsible
    phase.responsible_id = responsible_id
    phase.save()
    
    return todos

def get_user_todos(user_id):
    """
    Get all todos for a user
    """
    todos = Todo.objects.filter(user_id=user_id)
    
    todo_list = []
    for todo in todos:
        output = todo.output
        phase = output.phase
        ppap = phase.ppap
        project = ppap.project
        
        todo_list.append({
            'id': todo.id,
            'output_id': output.id,
            'output_name': output.template.name,
            'phase_id': phase.id,
            'phase_name': phase.template.name,
            'project_id': project.id,
            'project_name': project.name,
            'permission': todo.permission.name,
            'status': output.status
        })
    
    return todo_list

def get_pending_todos(user_id):
    """
    Get pending todos for a user (outputs that are not completed)
    """
    todos = Todo.objects.filter(
        user_id=user_id,
        output__status__in=['Not Started', 'In Progress', 'On Hold', 'Rejected']
    )
    
    todo_list = []
    for todo in todos:
        output = todo.output
        phase = output.phase
        ppap = phase.ppap
        project = ppap.project
        
        todo_list.append({
            'id': todo.id,
            'output_id': output.id,
            'output_name': output.template.name,
            'phase_id': phase.id,
            'phase_name': phase.template.name,
            'project_id': project.id,
            'project_name': project.name,
            'permission': todo.permission.name,
            'status': output.status
        })
    
    return todo_list
