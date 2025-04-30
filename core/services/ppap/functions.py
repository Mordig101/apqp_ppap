# Define project possible action and services
from django.db import transaction
from core.models import PPAP, Phase, Output
from core.services.history.api import (
    record_ppap_update,
    record_ppap_level_change
)
from core.services.output.initialization import initialize_outputs

@transaction.atomic
def update_ppap(ppap_id, data):
    """
    Update PPAP details
    """
    ppap = PPAP.objects.get(id=ppap_id)
    
    # Check for level change
    old_level = ppap.level
    new_level = data.get('level', old_level)
    
    # Update fields
    updated_fields = []
    for field, value in data.items():
        if hasattr(ppap, field) and getattr(ppap, field) != value:
            setattr(ppap, field, value)
            updated_fields.append(field)
    
    if updated_fields:
        ppap.save()
        record_ppap_update(ppap, updated_fields)
    
    # Handle level change
    if 'level' in updated_fields and old_level != new_level:
        record_ppap_level_change(ppap, old_level, new_level)
        
        # Update outputs based on new level
        update_outputs_for_level_change(ppap, new_level)
    
    return ppap

@transaction.atomic
def update_outputs_for_level_change(ppap, new_level):
    """
    Update outputs when PPAP level changes
    """
    # Get all phases for this PPAP
    phases = ppap.phases.all()
    
    for phase in phases:
        # Get existing outputs
        existing_outputs = phase.outputs.all()
        
        # Initialize new outputs based on new level
        initialize_outputs(phase.id, new_level, preserve_existing=True)
        
        # Mark outputs that are no longer required as 'Deprecated'
        for output in existing_outputs:
            ppap_element = output.template.ppap_element
            levels = ppap_element.level.split(',')
            
            if 'custom' not in levels and str(new_level) not in levels:
                output.status = 'Deprecated'
                output.save()

def get_ppap_details(ppap_id):
    """
    Get comprehensive PPAP details including all phases and outputs
    """
    ppap = PPAP.objects.get(id=ppap_id)
    
    # Get phases
    phases = ppap.phases.all().order_by('template__order')
    
    # Get outputs for each phase
    phase_details = []
    for phase in phases:
        outputs = phase.outputs.all()
        
        output_details = []
        for output in outputs:
            documents = output.documents.all()
            
            output_details.append({
                'id': output.id,
                'name': output.template.name,
                'description': output.description,
                'status': output.status,
                'responsible': output.user.username if output.user else None,
                'documents': [
                    {
                        'id': doc.id,
                        'name': doc.name,
                        'version': doc.version,
                        'status': doc.status
                    } for doc in documents
                ]
            })
        
        phase_details.append({
            'id': phase.id,
            'name': phase.template.name,
            'status': phase.status,
            'responsible': phase.responsible.username if phase.responsible else None,
            'outputs': output_details
        })
    
    # Compile PPAP details
    ppap_details = {
        'id': ppap.id,
        'project_id': ppap.project_id,
        'level': ppap.level,
        'status': ppap.status,
        'review': ppap.review,
        'phases': phase_details
    }
    
    return ppap_details
