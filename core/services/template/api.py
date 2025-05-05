from core.models import PhaseTemplate, OutputTemplate
from core.services.template.initialization import (
    initialize_phase_template,
    initialize_output_template
)
from core.services.template.functions import (
    get_phase_template_by_id,
    get_output_template_by_id,
    get_phase_templates_by_level,
    get_output_templates_by_phase,
    get_output_templates_by_element,
    update_phase_template_name,
    update_phase_template_description,
    update_phase_template_order,
    update_phase_template_ppap_levels,
    update_output_template_name,
    update_output_template_configuration,
    update_output_template_phase,
    clone_phase_template,
    clone_output_template,
    delete_phase_template,
    delete_output_template
)

__all__ = [
    'initialize_phase_template',
    'initialize_output_template',
    'get_phase_template_by_id',
    # ... other functions ...
]

def update_phase_template(template, name=None, description=None, order=None, ppap_levels=None):
    """
    Update phase template
    
    Args:
        template (PhaseTemplate): Template to update
        name (str, optional): New name
        description (str, optional): New description
        order (int, optional): New order
        ppap_levels (list, optional): New PPAP levels
        
    Returns:
        PhaseTemplate: Updated template
    """
    if name is not None:
        update_phase_template_name(template, name)
    
    if description is not None:
        update_phase_template_description(template, description)
    
    if order is not None:
        update_phase_template_order(template, order)
    
    if ppap_levels is not None:
        update_phase_template_ppap_levels(template, ppap_levels)
    
    return template

def update_output_template(template, name=None, configuration=None):
    """
    Update output template
    
    Args:
        template (OutputTemplate): Template to update
        name (str, optional): New name
        configuration (dict, optional): New configuration
        
    Returns:
        OutputTemplate: Updated template
    """
    if name is not None:
        update_output_template_name(template, name)
    
    if configuration is not None:
        update_output_template_configuration(template, configuration)
    
    return template

def delete_phase_template(template):
    """
    Delete phase template
    
    Args:
        template (PhaseTemplate): Template to delete
        
    Raises:
        ValueError: If template has dependencies
    """
    # Check if template has output templates
    if OutputTemplate.objects.filter(phase_template=template).exists():
        raise ValueError("Cannot delete template with dependencies")
    
    template.delete()

def delete_output_template(template):
    """
    Delete output template
    
    Args:
        template (OutputTemplate): Template to delete
    """
    template.delete()
