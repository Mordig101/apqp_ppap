# Permission logic
from core.models import User, Permission, Todo, Output

def assign_permission(user_id, output_id, permission_type):
    """
    Assign permission to a user for an output
    """
    user = User.objects.get(id=user_id)
    output = Output.objects.get(id=output_id)
    permission = Permission.objects.get(name=permission_type)
    
    # Check if todo already exists
    todo, created = Todo.objects.get_or_create(
        user=user,
        output=output,
        defaults={'permission': permission}
    )
    
    # Update permission if todo already exists
    if not created:
        todo.permission = permission
        todo.save()
    
    return todo

def check_permission(user_id, output_id, required_permission='r'):
    """
    Check if a user has the required permission for an output
    """
    try:
        todo = Todo.objects.get(user_id=user_id, output_id=output_id)
        
        # 'e' permission includes 'r' permission
        if required_permission == 'r' and todo.permission.name in ['r', 'e']:
            return True
        
        if required_permission == 'e' and todo.permission.name == 'e':
            return True
        
        return False
    except Todo.DoesNotExist:
        # Check if user has admin or create authorization
        user = User.objects.get(id=user_id)
        if user.authorization.name in ['admin', 'create']:
            return True
        
        # Check if user is responsible for the phase
        output = Output.objects.get(id=output_id)
        phase = output.phase
        if phase.responsible_id == user_id:
            return True
        
        return False

def get_user_permissions(user_id):
    """
    Get all permissions for a user
    """
    user = User.objects.get(id=user_id)
    
    # Check authorization level
    authorization = user.authorization.name
    
    if authorization in ['admin', 'create']:
        # Admin and create users have all permissions
        return {
            'global_permission': authorization,
            'output_permissions': []  # No need to list individual permissions
        }
    
    # Get todos for this user
    todos = Todo.objects.filter(user_id=user_id)
    
    output_permissions = []
    for todo in todos:
        output_permissions.append({
            'output_id': todo.output_id,
            'output_name': todo.output.template.name,
            'phase_id': todo.output.phase_id,
            'phase_name': todo.output.phase.template.name,
            'permission': todo.permission.name
        })
    
    return {
        'global_permission': authorization,
        'output_permissions': output_permissions
    }
