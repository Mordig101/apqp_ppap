# Authorization logic
from core.models import User, Authorization, Project, PPAP, Phase, Output

def check_user_authorization(user_id, action, entity_type, entity_id=None):
    """
    Check if a user is authorized to perform an action on an entity
    
    Actions: create, read, update, delete
    Entity types: project, ppap, phase, output, document, user, client, team
    """
    user = User.objects.get(id=user_id)
    authorization = user.authorization.name
    
    # Admin can do anything
    if authorization == 'admin':
        return True
    
    # Create users can create/read/update/delete most entities
    if authorization == 'create':
        # Create users cannot delete admin users
        if action == 'delete' and entity_type == 'user' and entity_id:
            target_user = User.objects.get(id=entity_id)
            if target_user.authorization.name == 'admin':
                return False
        
        return True
    
    # Edit users have limited permissions
    if authorization == 'edit':
        # Edit users can read most entities
        if action == 'read':
            # For outputs, check specific permissions
            if entity_type == 'output' and entity_id:
                return check_output_permission(user_id, entity_id, 'r')
            
            # For documents, check output permission
            if entity_type == 'document' and entity_id:
                from core.models import Document
                document = Document.objects.get(id=entity_id)
                return check_output_permission(user_id, document.output_id, 'r')
            
            return True
        
        # Edit users can update outputs they are responsible for
        if action == 'update':
            if entity_type == 'output' and entity_id:
                return check_output_permission(user_id, entity_id, 'e')
            
            if entity_type == 'document' and entity_id:
                from core.models import Document
                document = Document.objects.get(id=entity_id)
                return check_output_permission(user_id, document.output_id, 'e')
            
            if entity_type == 'phase' and entity_id:
                phase = Phase.objects.get(id=entity_id)
                return phase.responsible_id == user_id
            
            # Edit users cannot update other entity types
            return False
        
        # Edit users can create documents for outputs they are responsible for
        if action == 'create' and entity_type == 'document':
            # entity_id here is the output_id
            if entity_id:
                return check_output_permission(user_id, entity_id, 'e')
            
            return False
        
        # Edit users cannot delete or create other entity types
        return False
    
    # Default: not authorized
    return False

def check_output_permission(user_id, output_id, required_permission='r'):
    """
    Check if a user has the required permission for an output
    """
    from core.services.logic.permission import check_permission
    return check_permission(user_id, output_id, required_permission)

def get_user_authorization_details(user_id):
    """
    Get detailed authorization information for a user
    """
    user = User.objects.get(id=user_id)
    authorization = user.authorization.name
    
    # Get permissions based on authorization level
    permissions = {
        'admin': {
            'can_create': ['project', 'ppap', 'phase', 'output', 'document', 'user', 'client', 'team'],
            'can_read': ['project', 'ppap', 'phase', 'output', 'document', 'user', 'client', 'team'],
            'can_update': ['project', 'ppap', 'phase', 'output', 'document', 'user', 'client', 'team'],
            'can_delete': ['project', 'ppap', 'phase', 'output', 'document', 'user', 'client', 'team']
        },
        'create': {
            'can_create': ['project', 'ppap', 'phase', 'output', 'document', 'user', 'client', 'team'],
            'can_read': ['project', 'ppap', 'phase', 'output', 'document', 'user', 'client', 'team'],
            'can_update': ['project', 'ppap', 'phase', 'output', 'document', 'user', 'client', 'team'],
            'can_delete': ['project', 'ppap', 'phase', 'output', 'document', 'user', 'client', 'team']
        },
        'edit': {
            'can_create': ['document'],
            'can_read': ['project', 'ppap', 'phase', 'output', 'document', 'user', 'client', 'team'],
            'can_update': [],  # Will be populated with specific outputs
            'can_delete': []
        }
    }
    
    # For edit users, get specific output permissions
    if authorization == 'edit':
        from core.models import Todo
        todos = Todo.objects.filter(user_id=user_id)
        
        for todo in todos:
            if todo.permission.name == 'e':
                if 'output' not in permissions['edit']['can_update']:
                    permissions['edit']['can_update'].append('output')
                
                if 'document' not in permissions['edit']['can_update']:
                    permissions['edit']['can_update'].append('document')
        
        # Check if user is responsible for any phases
        responsible_phases = Phase.objects.filter(responsible_id=user_id)
        if responsible_phases.exists() and 'phase' not in permissions['edit']['can_update']:
            permissions['edit']['can_update'].append('phase')
    
    return {
        'user_id': user_id,
        'username': user.username,
        'authorization_level': authorization,
        'permissions': permissions[authorization]
    }
