# Phase history tracking
from core.models import History, Phase
from core.services.history.initialization import initialize_history

def record_phase_creation(phase):
    """
    Record phase creation in history
    """
    initialize_history(
        title=f"{phase.template.name} for PPAP {phase.ppap_id}",
        event=f"Phase created based on template {phase.template.id}",
        table_name='phase',
        history_id=phase.history_id
    )

def record_phase_update(phase, updated_fields):
    """
    Record phase update in history
    """
    initialize_history(
        title=f"{phase.template.name} for PPAP {phase.ppap_id}",
        event=f"Phase updated: {', '.join(updated_fields)}",
        table_name='phase',
        history_id=phase.history_id
    )

def record_phase_status_change(phase, old_status, new_status):
    """
    Record phase status change in history
    """
    initialize_history(
        title=f"{phase.template.name} for PPAP {phase.ppap_id}",
        event=f"Phase status changed from {old_status} to {new_status}",
        table_name='phase',
        history_id=phase.history_id
    )
