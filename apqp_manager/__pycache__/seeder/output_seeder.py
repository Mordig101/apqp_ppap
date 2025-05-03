"""
Seeder for Output model
"""
import os
import django
import uuid
from faker import Faker

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'apqp_manager.settings')
django.setup()

from django.db import transaction
from core.models import Output, Phase, OutputTemplate, User

fake = Faker()

@transaction.atomic
def seed_outputs():
    """Seed output data"""
    print("Seeding outputs...")
    
    # Clear existing data
    Output.objects.all().delete()
    
    # Get phases, output templates, and users
    phases = Phase.objects.all()
    users = User.objects.all()
    
    if not phases or not users:
        print("Error: Phases and Users must be seeded first")
        return
    
    # Create outputs for each phase
    outputs = []
    
    for phase in phases:
        # Get output templates for this phase's template
        output_templates = OutputTemplate.objects.filter(phase=phase.template)
        
        # Map phase status to output statuses
        phase_status = phase.status
        
        for template in output_templates:
            history_id = f"{uuid.uuid4().hex}output"
            
            # Determine output status based on phase status
            if phase_status == 'Not Started':
                output_status = 'Not Started'
            elif phase_status == 'On Hold':
                output_status = 'On Hold'
            elif phase_status == 'Completed':
                output_status = 'Completed'
            else:  # In Progress
                output_status = fake.random_element(['Not Started', 'In Progress', 'Completed'])
            
            # Assign a random user
            user = fake.random_element(users)
            
            output_data = {
                'template': template,
                'description': fake.paragraph(),
                'user': user,
                'phase': phase,
                'status': output_status,
                'history_id': history_id
            }
            
            outputs.append(Output.objects.create(**output_data))
    
    print(f"Created {len(outputs)} outputs")
    return outputs

if __name__ == "__main__":
    seed_outputs()
