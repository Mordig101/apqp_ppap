from core.models import PhaseTemplate, OutputTemplate

def initialize_phase_template(name, description='', order=0, ppap_levels=None):
    """
    Initialize a new phase template
    
    Args:
        name (str): Template name
        description (str, optional): Template description
        order (int, optional): Template order
        ppap_levels (list, optional): PPAP levels
        
    Returns:
        PhaseTemplate: The created template
    """
    template = PhaseTemplate.objects.create(
        name=name,
        description=description,
        order=order
    )
    
    # Set PPAP levels if provided
    if ppap_levels:
        template.ppap_levels = ppap_levels
        template.save()
    
    # Record in history
    
    return template

def initialize_output_template(name, phase_template, ppap_element, configuration=None):
    """
    Initialize a new output template
    
    Args:
        name (str): Template name
        phase_template (PhaseTemplate): Associated phase template
        ppap_element (PPAPElement): Associated PPAP element
        configuration (dict, optional): Template configuration
        
    Returns:
        OutputTemplate: The created template
    """
    template = OutputTemplate.objects.create(
        name=name,
        phase=phase_template,  # Changed from phase_template to phase
        ppap_element=ppap_element,
        configuration=configuration or {}
    )
    
    return template
