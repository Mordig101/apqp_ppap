"""
Seeder for Department model
"""
import os
import django
import uuid

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'apqp_manager.settings')
django.setup()

from django.db import transaction
from core.models import Department

@transaction.atomic
def seed_departments():
    """Seed department data"""
    print("Seeding departments...")
    
    # Clear existing data
    Department.objects.all().delete()
    
    # Create departments
    departments = [
        {
            'name': 'Engineering',
            'history_id': f"{uuid.uuid4().hex}department"
        },
        {
            'name': 'Quality',
            'history_id': f"{uuid.uuid4().hex}department"
        },
        {
            'name': 'Production',
            'history_id': f"{uuid.uuid4().hex}department"
        },
        {
            'name': 'Management',
            'history_id': f"{uuid.uuid4().hex}department"
        },
        {
            'name': 'Sales',
            'history_id': f"{uuid.uuid4().hex}department"
        }
    ]
    
    # Insert departments
    for dept_data in departments:
        Department.objects.create(**dept_data)
    
    print(f"Created {len(departments)} departments")
    return Department.objects.all()

if __name__ == "__main__":
    seed_departments()
