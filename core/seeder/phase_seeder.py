"""
Seeder for Phase model
"""
import os
import django
import uuid
from faker import Faker

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'apqp_manager.settings')
django.setup()

from django.db import transaction
from core.models import Phase, PPAP, PhaseTemplate, User

fake = Faker()

@transaction.atomic
def seed_phases():
    """Seed phase data"""
    print("Seeding phases...")
    
    # Clear existing data
    Phase.objects.all().delete()
    
    # Get PPAPs, phase templates, and users
    ppaps = PPAP.objects.all()
    phase_templates = PhaseTemplate.objects.all().order_by('order')
    users = User.objects.all()
    
    if not ppaps or not phase_templates or not users:
        print("Error: PPAPs, Phase Templates, and Users must be seeded first")
        return
    
    # Create phases for each PPAP
    phases = []
    
    for ppap in ppaps:
        # Map PPAP status to phase statuses
        ppap_status = ppap.status
        
        for template in phase_templates:
            history_id = f"{uuid.uuid4().hex}phase"
            
            # Determine phase status based on PPAP status and template order
            if ppap_status == 'Not Started':
                phase_status = 'Not Started'
            elif ppap_status == 'On Hold':
                phase_status = 'On Hold'
            elif ppap_status in ['Completed', 'Approved']:
                phase_status = 'Completed'
            else:  # In Progress
                # Earlier phases are more likely to be completed
                if template.order < 3:
                    phase_status = fake.random_element(['Completed', 'In Progress'])
                elif template.order < 5:
                    phase_status = fake.random_element(['In Progress', 'Not Started'])
                else:
                    phase_status = 'Not Started'
            
            # Assign a random responsible user
            responsible = fake.random_element(users)
            
            phase_data = {
                'template': template,
                'responsible': responsible,
                'ppap': ppap,
                'status': phase_status,
                'history_id': history_id
            }
            
            phases.append(Phase.objects.create(**phase_data))
    
    print(f"Created {len(phases)} phases")
    return phases

if __name__ == "__main__":
    seed_phases()
