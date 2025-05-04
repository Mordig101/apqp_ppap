import uuid
from django.db import transaction
from core.models import Phase, PhaseTemplate
from core.services.history.initialization import initialize_history
from core.services.output.initialization import initialize_outputs

@transaction.atomic
def initialize_phases(ppap_id, ppap_level):
    """
    Initialize phases for a PPAP based on templates
    """
    # Get phase templates appropriate for this PPAP level
    phase_templates = PhaseTemplate.objects.all().order_by('order')
    
    phases = []
    
    for template in phase_templates:
        # Generate history ID
        history_id = f"{uuid.uuid4().hex}phase"
        
        # Create phase record
        phase = Phase.objects.create(
            template=template,
            ppap_id=ppap_id,
            status='Not Started',
            history_id=history_id
        )
        
        # Initialize history record
        
        # Initialize outputs for this phase
        initialize_outputs(phase.id, ppap_level)
        
        phases.append(phase)
    
    return phases
