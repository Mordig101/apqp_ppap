"""
Seeder for PPAPElement model
"""
import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'apqp_manager.settings')
django.setup()

from django.db import transaction
from core.models import PPAPElement

@transaction.atomic
def seed_ppap_elements():
    """Seed PPAP element data"""
    print("Seeding PPAP elements...")
    
    # Clear existing data
    PPAPElement.objects.all().delete()
    
    # Create PPAP elements
    ppap_elements = [
        {
            'name': 'Design Records',
            'level': '1,2,3,4,5'
        },
        {
            'name': 'Engineering Change Documents',
            'level': '1,2,3,4,5'
        },
        {
            'name': 'Customer Engineering Approval',
            'level': '1,2,3,4,5'
        },
        {
            'name': 'Design FMEA',
            'level': '2,3,4,5'
        },
        {
            'name': 'Process Flow Diagrams',
            'level': '2,3,4,5'
        },
        {
            'name': 'Process FMEA',
            'level': '2,3,4,5'
        },
        {
            'name': 'Control Plan',
            'level': '2,3,4,5'
        },
        {
            'name': 'Measurement System Analysis Studies',
            'level': '3,4,5'
        },
        {
            'name': 'Dimensional Results',
            'level': '3,4,5'
        },
        {
            'name': 'Material, Performance Test Results',
            'level': '3,4,5'
        },
        {
            'name': 'Initial Process Studies',
            'level': '3,4,5'
        },
        {
            'name': 'Qualified Laboratory Documentation',
            'level': '4,5'
        },
        {
            'name': 'Appearance Approval Report',
            'level': '4,5'
        },
        {
            'name': 'Sample Production Parts',
            'level': '4,5'
        },
        {
            'name': 'Master Sample',
            'level': '4,5'
        },
        {
            'name': 'Checking Aids',
            'level': '5'
        },
        {
            'name': 'Customer-Specific Requirements',
            'level': '5'
        },
        {
            'name': 'Part Submission Warrant',
            'level': '1,2,3,4,5'
        },
        {
            'name': 'Custom PPAP Element',
            'level': 'custom'
        }
    ]
    
    # Insert PPAP elements
    created_elements = []
    for element_data in ppap_elements:
        created_elements.append(PPAPElement.objects.create(**element_data))
    
    print(f"Created {len(created_elements)} PPAP elements")
    return created_elements

if __name__ == "__main__":
    seed_ppap_elements()
