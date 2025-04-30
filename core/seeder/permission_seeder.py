"""
Seeder for Permission model
"""
import os
import django
import uuid

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'apqp_manager.settings')
django.setup()

from django.db import transaction
from core.models import Permission

@transaction.atomic
def seed_permissions():
    """Seed permission data"""
    print("Seeding permissions...")
    
    # Clear existing data
    Permission.objects.all().delete()
    
    # Create permissions
    permissions = [
        {
            'name': 'r',
            'description': 'Read only',
            'history_id': f"{uuid.uuid4().hex}permission"
        },
        {
            'name': 'e',
            'description': 'Edit and read',
            'history_id': f"{uuid.uuid4().hex}permission"
        }
    ]
    
    # Insert permissions
    for perm_data in permissions:
        Permission.objects.create(**perm_data)
    
    print(f"Created {len(permissions)} permissions")
    return Permission.objects.all()

if __name__ == "__main__":
    seed_permissions()
