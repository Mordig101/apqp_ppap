"""
Seeder for PhaseTemplate model
"""
import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'apqp_manager.settings')
django.setup()

from django.db import transaction
from core.models import PhaseTemplate

@transaction.atomic
def seed_phase_templates():
    """Seed phase template data"""
    print("Seeding phase templates...")
    
    # Clear existing data
    PhaseTemplate.objects.all().delete()
    
    # Create phase templates based on APQP phases
    phase_templates = [
        {
            'name': 'Prepare for APQP',
            'description': 'Initial preparation phase for APQP',
            'order': 1
        },
        {
            'name': 'Plan and Define Program',
            'description': 'Planning and program definition phase',
            'order': 2
        },
        {
            'name': 'Product Design and Development',
            'description': 'Design and development of the product',
            'order': 3
        },
        {
            'name': 'Process Design and Development',
            'description': 'Design and development of the manufacturing process',
            'order': 4
        },
        {
            'name': 'Product and Process Validation',
            'description': 'Validation of product and process',
            'order': 5
        },
        {
            'name': 'Feedback, Assessment and Corrective Action',
            'description': 'Feedback, assessment and corrective action phase',
            'order': 6
        }
    ]
    
    # Insert phase templates
    created_templates = []
    for template_data in phase_templates:
        created_templates.append(PhaseTemplate.objects.create(**template_data))
    
    print(f"Created {len(created_templates)} phase templates")
    return created_templates

if __name__ == "__main__":
    seed_phase_templates()
