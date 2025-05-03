"""
Seeder for Contact model
"""
import os
import django
import uuid
from faker import Faker

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'apqp_manager.settings')
django.setup()

from django.db import transaction
from core.models import Contact, Person

fake = Faker()

@transaction.atomic
def seed_contacts():
    """Seed contact data"""
    print("Seeding contacts...")
    
    # Clear existing data
    Contact.objects.all().delete()
    
    # Get persons
    persons = Person.objects.all()
    
    if not persons:
        print("Error: Persons must be seeded first")
        return
    
    # Create contacts for each person
    contacts = []
    for person in persons:
        contact_data = {
            'id': person.contact_id,  # Use the contact_id from the person
            'address': fake.address(),
            'email': fake.email(),
            'phone': fake.phone_number(),
            'type': 'user' if person.is_user else 'client_member',
            'history_id': f"{uuid.uuid4().hex}contact"
        }
        contacts.append(contact_data)
    
    # Insert contacts
    created_contacts = []
    for contact_data in contacts:
        created_contacts.append(Contact.objects.create(**contact_data))
    
    print(f"Created {len(created_contacts)} contacts")
    return created_contacts

if __name__ == "__main__":
    seed_contacts()
