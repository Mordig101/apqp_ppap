import uuid
from django.db import transaction
from core.models import PPAP, Phase, Output
from core.services.history.initialization import initialize_history
from core.services.phase.initialization import initialize_phases
from core.services.history.ppap import record_ppap_creation

@transaction.atomic
def initialize_ppap(project_id, level):
    """
    Initialize a new PPAP record with phases and outputs
    """
    # Get the Project instance first
    from core.models import Project
    project = Project.objects.get(id=project_id)
    
    # Create PPAP record without setting history_id
    ppap = PPAP.objects.create(
        project=project,  # Use the project instance, not the ID
        level=level,
        status='Not Started',
    )
    
    # Initialize history record using the model-generated history_id
    record_ppap_creation(ppap)
    
    # Initialize phases based on PPAP level
    initialize_phases(ppap.id, level)
    
    return ppap
