"""
Seeder for Client model
"""
import os
import django
import uuid
from faker import Faker

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'apqp_manager.settings')
django.setup()

from django.db import transaction
from core.models import Client, Team, Contact

fake = Faker()

@transaction.atomic
def seed_clients():
    """Seed client data"""
    print("Seeding clients...")
    
    # Clear existing data
    Client.objects.all().delete()
    
    # Get client team
    try:
        client_team = Team.objects.get(name='Client Team')
    except Team.DoesNotExist:
        client_team = Team.objects.first()
    
    # Create clients
    clients = []
    
    for i in range(5):
        # Generate a unique contact_id for each client
        contact_id = f"{uuid.uuid4().hex}client"
        history_id = f"{uuid.uuid4().hex}client"
        
        client_data = {
            'name': fake.company(),
            'address': fake.address(),
            'code': {
                'DUNS': fake.numerify('#########'),
                'Fiscal': f"FC-{fake.numerify('######')}"
            },
            'description': fake.catch_phrase(),
            'team': client_team,
            'contact_id': contact_id,
            'history_id': history_id
        }
        
        # Create client
        client = Client.objects.create(**client_data)
        
        # Create contact for client
        Contact.objects.create(
            id=contact_id,
            address=client.address,
            email=fake.company_email(),
            phone=fake.phone_number(),
            type='client',
            history_id=f"{uuid.uuid4().hex}contact"
        )
        
        clients.append(client)
    
    print(f"Created {len(clients)} clients with contacts")
    return clients

if __name__ == "__main__":
    seed_clients()
