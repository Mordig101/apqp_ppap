# Define level logic to only display to the user what he needs base on the level
from core.models import PPAP, Phase, Output, PPAPElement

def filter_outputs_by_level(ppap_level):
    """
    Filter outputs based on PPAP level
    """
    # Get PPAP elements for this level
    elements = PPAPElement.objects.filter(level__contains=str(ppap_level))
    
    # Get output templates for these elements
    output_templates = []
    for element in elements:
        templates = element.output_templates.all()
        output_templates.extend(templates)
    
    return output_templates

def get_visible_outputs_for_user(user, ppap_id):
    """
    Get outputs visible to a user based on PPAP level and permissions
    """
    ppap = PPAP.objects.get(id=ppap_id)
    level = ppap.level
    
    # Get all phases for this PPAP
    phases = Phase.objects.filter(ppap_id=ppap_id)
    
    visible_outputs = []
    
    # Check user's authorization level
    authorization = user.authorization.name
    
    # Admin and create users can see everything
    if authorization in ['admin', 'create']:
        for phase in phases:
            outputs = Output.objects.filter(phase=phase)
            visible_outputs.extend(outputs)
        return visible_outputs
    
    # For edit users, check specific permissions
    for phase in phases:
        # Get todos for this user
        todos = user.todos.filter(output__phase=phase)
        
        # Get outputs where user has edit permission
        edit_output_ids = todos.filter(permission__name='e').values_list('output_id', flat=True)
        edit_outputs = Output.objects.filter(id__in=edit_output_ids)
        visible_outputs.extend(edit_outputs)
        
        # Get outputs in the same phase where user has read permission
        read_output_ids = todos.filter(permission__name='r').values_list('output_id', flat=True)
        read_outputs = Output.objects.filter(id__in=read_output_ids)
        visible_outputs.extend(read_outputs)
        
        # If user has any permission in this phase, they can see all outputs in the phase
        if todos.exists():
            phase_outputs = Output.objects.filter(phase=phase)
            visible_outputs.extend(phase_outputs)
    
    # Remove duplicates
    visible_outputs = list(set(visible_outputs))
    
    return visible_outputs

def get_dashboard_items_by_level(user, ppap_level=None):
    """
    Get dashboard items filtered by PPAP level
    """
    # Get user's authorization level
    authorization = user.authorization.name
    
    # Admin and create users can see everything
    if authorization in ['admin', 'create']:
        if ppap_level:
            # Filter by PPAP level
            ppaPs = PPAP.objects.filter(level=ppap_level)
        else:
            # Show all PPAPs
            ppaPs = PPAP.objects.all()
    else:
        # For edit users, show only PPAPs where they have assigned outputs
        if ppap_level:
            # Filter by PPAP level and user's todos
            output_ids = user.todos.values_list('output_id', flat=True)
            outputs = Output.objects.filter(id__in=output_ids)
            phase_ids = outputs.values_list('phase_id', flat=True)
            phases = Phase.objects.filter(id__in=phase_ids)
            ppap_ids = phases.values_list('ppap_id', flat=True)
            ppaPs = PPAP.objects.filter(id__in=ppap_ids, level=ppap_level)
        else:
            # Show all PPAPs where user has assigned outputs
            output_ids = user.todos.values_list('output_id', flat=True)
            outputs = Output.objects.filter(id__in=output_ids)
            phase_ids = outputs.values_list('phase_id', flat=True)
            phases = Phase.objects.filter(id__in=phase_ids)
            ppap_ids = phases.values_list('ppap_id', flat=True)
            ppaPs = PPAP.objects.filter(id__in=ppap_ids)
    
    # Get projects for these PPAPs
    projects = []
    for ppap in ppaPs:
        project = ppap.project
        projects.append({
            'id': project.id,
            'name': project.name,
            'status': project.status,
            'ppap_level': ppap.level,
            'ppap_status': ppap.status,
            'client': project.client.name,
            'team': project.team.name
        })
    
    return projects
