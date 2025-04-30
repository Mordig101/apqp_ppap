import uuid
from django.db import transaction
from core.models import Output, OutputTemplate, PPAPElement
from core.services.history.initialization import initialize_history

@transaction.atomic
def initialize_outputs(phase_id, ppap_level, preserve_existing=False):
    """
    Initialize outputs for a phase based on templates and PPAP level
    """
    from core.models import Phase
    
    phase = Phase.objects.get(id=phase_id)
    phase_template = phase.template
    
    # Get output templates for this phase template
    output_templates = OutputTemplate.objects.filter(phase=phase_template)
    
    # Filter templates based on PPAP level
    filtered_templates = []
    for template in output_templates:
        ppap_element = template.ppap_element
        levels = ppap_element.level.split(',')
        if 'custom' in levels or str(ppap_level) in levels:
            filtered_templates.append(template)
    
    outputs = []
    
    # If preserving existing, get existing output templates
    existing_template_ids = []
    if preserve_existing:
        existing_template_ids = list(phase.outputs.values_list('template_id', flat=True))
    
    for template in filtered_templates:
        # Skip if already exists and preserving
        if preserve_existing and template.id in existing_template_ids:
            continue
        
        # Generate history ID
        history_id = f"{uuid.uuid4().hex}output"
        
        # Create output record
        output = Output.objects.create(
            template=template,
            phase=phase,
            status='Not Started',
            history_id=history_id
        )
        
        # Initialize history record
        initialize_history(
            title=f"{template.name} for Phase {phase_id}",
            event=f"Output created based on template {template.id}",
            table_name='output',
            history_id=history_id
        )
        
        outputs.append(output)
    
    return outputs
