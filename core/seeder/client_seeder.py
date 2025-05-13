"""
Seeder for Client model
"""
import os
import django
import sys
import uuid
from faker import Faker

# Add the project root directory to Python's path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'apqp_manager.settings')
django.setup()

from django.db import transaction, connection
from core.models import Client, Team, Contact

fake = Faker()

@transaction.atomic
def seed_clients():
    """Seed client data"""
    print("Seeding clients...")
    
    # Get client team
    try:
        # Try to find a team with 'Client' in the name
        client_team = Team.objects.filter(name__icontains='Client').first()
        if not client_team:
            client_team = Team.objects.first()  # Fallback to first team
            
        if not client_team:
            print("Error: No teams found. Please run team seeder first.")
            return []
            
    except Exception as e:
        print(f"Error getting client team: {e}")
        return []
    
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
        
        try:
            # Create client without specifying ID
            client = Client(**client_data)
            client.save()
            
            # Create contact for client
            Contact.objects.create(
                id=contact_id,
                address=client.address,
                email=fake.company_email(),
                phone=fake.phone_number(),
                type='client',
                history_id=f"{contact_id}history"
            )
            
            clients.append(client)
            
        except Exception as e:
            print(f"Error creating client: {e}")
            # Don't break the transaction for one failed client
            continue
    
    print(f"Created {len(clients)} clients with contacts")
    return clients

if __name__ == "__main__":
    seed_clients()
