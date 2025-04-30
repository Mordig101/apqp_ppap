import uuid
from django.db import transaction
from core.models import PPAP, Phase, Output
from core.services.history.initialization import initialize_history
from core.services.phase.initialization import initialize_phases

@transaction.atomic
def initialize_ppap(project_id, level):
    """
    Initialize a new PPAP record with phases and outputs
    """
    # Generate history ID
    history_id = f"{uuid.uuid4().hex}ppap"
    
    # Create PPAP record
    ppap = PPAP.objects.create(
        project_id=project_id,
        level=level,
        status='Not Started',
        history_id=history_id
    )
    
    # Initialize history record
    initialize_history(
        title=f"PPAP for Project {project_id}",
        event=f"PPAP created with level {level}",
        table_name='ppap',
        history_id=history_id
    )
    
    # Initialize phases based on PPAP level
    initialize_phases(ppap.id, level)
    
    return ppap
