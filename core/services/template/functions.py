from core.models import PhaseTemplate, OutputTemplate

def get_phase_template_by_id(template_id):
    """
    Get phase template by ID
    
    Args:
        template_id (int): Template ID
        
    Returns:
        PhaseTemplate: The template object
        
    Raises:
        PhaseTemplate.DoesNotExist: If template not found
    """
    return PhaseTemplate.objects.get(id=template_id)

def get_output_template_by_id(template_id):
    """
    Get output template by ID
    
    Args:
        template_id (int): Template ID
        
    Returns:
        OutputTemplate: The template object
        
    Raises:
        OutputTemplate.DoesNotExist: If template not found
    """
    return OutputTemplate.objects.get(id=template_id)

def get_phase_templates_by_level(level):
    """
    Get phase templates by PPAP level
    
    Args:
        level (int): PPAP level
        
    Returns:
        QuerySet: Templates for the given level
    """
    return PhaseTemplate.objects.filter(ppap_levels__contains=[level]).order_by('order')

def get_output_templates_by_phase(phase_id):
    """
    Get output templates by phase template
    
    Args:
        phase_id (int): Phase template ID
        
    Returns:
        QuerySet: Templates for the given phase
    """
    return OutputTemplate.objects.filter(phase_template_id=phase_id)

def get_output_templates_by_element(element_id):
    """
    Get output templates by PPAP element
    
    Args:
        element_id (int): PPAP element ID
        
    Returns:
        QuerySet: Templates for the given element
    """
    return OutputTemplate.objects.filter(ppap_element_id=element_id)

def update_phase_template_name(template, name):
    """
    Update phase template name
    
    Args:
        template (PhaseTemplate): Template to update
        name (str): New name
        
    Returns:
        PhaseTemplate: Updated template
    """
    template.name = name
    template.save()
    return template

def update_phase_template_description(template, description):
    """
    Update phase template description
    
    Args:
        template (PhaseTemplate): Template to update
        description (str): New description
        
    Returns:
        PhaseTemplate: Updated template
    """
    template.description = description
    template.save()
    return template

def update_phase_template_order(template, order):
    """
    Update phase template order
    
    Args:
        template (PhaseTemplate): Template to update
        order (int): New order
        
    Returns:
        PhaseTemplate: Updated template
    """
    template.order = order
    template.save()
    return template

def update_phase_template_ppap_levels(template, ppap_levels):
    """
    Update phase template PPAP levels
    
    Args:
        template (PhaseTemplate): Template to update
        ppap_levels (list): New PPAP levels
        
    Returns:
        PhaseTemplate: Updated template
    """
    template.ppap_levels = ppap_levels
    template.save()
    return template

def update_output_template_name(template, name):
    """
    Update output template name
    
    Args:
        template (OutputTemplate): Template to update
        name (str): New name
        
    Returns:
        OutputTemplate: Updated template
    """
    template.name = name
    template.save()
    return template

def update_output_template_configuration(template, configuration):
    """
    Update output template configuration
    
    Args:
        template (OutputTemplate): Template to update
        configuration (dict): New configuration
        
    Returns:
        OutputTemplate: Updated template
    """
    template.configuration = configuration
    template.save()
    return template

def clone_phase_template(template_id, new_name=None):
    """
    Clone a phase template
    
    Args:
        template_id (int): Template ID to clone
        new_name (str, optional): Name for the cloned template
        
    Returns:
        PhaseTemplate: The cloned template
    """
    original = get_phase_template_by_id(template_id)
    
    # Create new template
    clone = PhaseTemplate.objects.create(
        name=new_name or f"Copy of {original.name}",
        description=original.description,
        order=original.order,
        ppap_levels=original.ppap_levels
    )
    
    return clone

def clone_output_template(template_id, new_name=None):
    """
    Clone an output template
    
    Args:
        template_id (int): Template ID to clone
        new_name (str, optional): Name for the cloned template
        
    Returns:
        OutputTemplate: The cloned template
    """
    original = get_output_template_by_id(template_id)
    
    # Create new template
    clone = OutputTemplate.objects.create(
        name=new_name or f"Copy of {original.name}",
        phase_template=original.phase_template,
        ppap_element=original.ppap_element,
        configuration=original.configuration
    )
    
    return clone
