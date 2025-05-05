import uuid
from django.db import transaction
from core.models import Phase, PhaseTemplate
from core.services.history.initialization import initialize_history
from core.services.output.initialization import initialize_outputs
from core.services.history.phase import record_phase_creation, record_phase_update

@transaction.atomic
def initialize_phases(ppap_id, ppap_level):
    """
    Initialize phases for a PPAP based on templates
    """
    # Get phase templates appropriate for this PPAP level
    phase_templates = PhaseTemplate.objects.all().order_by('order')
    
    phases = []
    
    for template in phase_templates:        
        # Create phase record
        phase = Phase.objects.create(
            template=template,
            ppap_id=ppap_id,
            status='Not Started',
        )
        
        # Record creation in history
        record_phase_creation(phase)
        
        # Initialize outputs
        initialize_outputs(phase.id, ppap_level)
        
        phases.append(phase)
    
    return phases
