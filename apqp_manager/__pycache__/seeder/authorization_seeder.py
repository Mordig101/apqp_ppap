"""
Seeder for Authorization model
"""
import os
import django
import uuid

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'apqp_manager.settings')
django.setup()

from django.db import transaction
from core.models import Authorization

@transaction.atomic
def seed_authorizations():
    """Seed authorization data"""
    print("Seeding authorizations...")
    
    # Clear existing data
    Authorization.objects.all().delete()
    
    # Create authorizations
    authorizations = [
        {
            'name': 'admin',
            'history_id': f"{uuid.uuid4().hex}authorization"
        },
        {
            'name': 'create',
            'history_id': f"{uuid.uuid4().hex}authorization"
        },
        {
            'name': 'edit',
            'history_id': f"{uuid.uuid4().hex}authorization"
        }
    ]
    
    # Insert authorizations
    for auth_data in authorizations:
        Authorization.objects.create(**auth_data)
    
    print(f"Created {len(authorizations)} authorizations")
    return Authorization.objects.all()

if __name__ == "__main__":
    seed_authorizations()
