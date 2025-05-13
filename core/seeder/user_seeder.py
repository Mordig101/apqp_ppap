"""
Seeder for User model
"""
import os
import django
import uuid
from faker import Faker

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'apqp_manager.settings')
django.setup()

from django.db import transaction
from core.models import User, Person, Authorization, Contact, Department

fake = Faker()

@transaction.atomic
def seed_users():
    """Seed user data"""
    print("Seeding users...")
    
    # Clear existing data
    User.objects.all().delete()
    
    # Get authorizations
    try:
        admin_auth = Authorization.objects.get(name='admin')
        create_auth = Authorization.objects.get(name='create')
        edit_auth = Authorization.objects.get(name='edit')
    except Authorization.DoesNotExist:
        print("Error: Authorizations must be seeded first")
        return []
    
    # Get or create specific persons
    
    # Admin user
    admin_person, created = Person.objects.get_or_create(
        first_name='Admin',
        last_name='User',
        defaults={
            'is_user': True,
            'role': 'Administrator'
        }
    )
    if created:
        print("Created Admin User person")
        # Create contact for admin if needed
        Contact.objects.get_or_create(
            id=admin_person.contact_id,
            defaults={
                'email': 'admin@example.com',
                'phone': '+1234567890',
                'address': '123 Admin St',
                'type': 'person',
                'history_id': f"{admin_person.contact_id}history"
            }
        )
    
    # Engineer user
    engineer_person, created = Person.objects.get_or_create(
        first_name='John',
        last_name='Engineer',
        defaults={
            'is_user': True,
            'role': 'Design Engineer',
            'department': Department.objects.order_by('?').first()  # Random department
        }
    )
    if created:
        print("Created John Engineer person")
        # Create contact for engineer if needed
        Contact.objects.get_or_create(
            id=engineer_person.contact_id,
            defaults={
                'email': 'john.engineer@example.com',
                'phone': '+1234567891',
                'address': '456 Engineer St',
                'type': 'person',
                'history_id': f"{engineer_person.contact_id}history"
            }
        )
    
    # Quality user
    quality_person, created = Person.objects.get_or_create(
        first_name='Jane',
        last_name='Quality',
        defaults={
            'is_user': True,
            'role': 'Quality Assurance Lead',
            'department': Department.objects.order_by('?').first()  # Random department
        }
    )
    if created:
        print("Created Jane Quality person")
        # Create contact for quality if needed
        Contact.objects.get_or_create(
            id=quality_person.contact_id,
            defaults={
                'email': 'jane.quality@example.com',
                'phone': '+1234567892',
                'address': '789 Quality St',
                'type': 'person',
                'history_id': f"{quality_person.contact_id}history"
            }
        )
    
    # Create users
    users = []
    
    # Create admin user
    admin_user = {
        'username': 'admin',
        'password': 'admin123',
        'person': admin_person,
        'authorization': admin_auth,
        'is_staff': True,
        'is_superuser': True,
        'history_id': f"{uuid.uuid4().hex}user"
    }
    users.append(admin_user)
    
    # Create engineer user
    engineer_user = {
        'username': 'john',
        'password': 'john123',
        'person': engineer_person,
        'authorization': edit_auth,
        'history_id': f"{uuid.uuid4().hex}user"
    }
    users.append(engineer_user)
    
    # Create quality user
    quality_user = {
        'username': 'jane',
        'password': 'jane123',
        'person': quality_person,
        'authorization': edit_auth,
        'history_id': f"{uuid.uuid4().hex}user"
    }
    users.append(quality_user)
    
    # Get persons who are users
    other_persons = Person.objects.filter(is_user=True).exclude(id__in=[
        admin_person.id, engineer_person.id, quality_person.id
    ])
    
    # Create additional users for other persons
    for person in other_persons:
        username = f"{person.first_name.lower()}.{person.last_name.lower()}"
        
        # Check for username conflicts and append number if needed
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
            
        password = f"{person.first_name.lower()}123"
        
        # Randomly assign authorization
        auth = fake.random_element([create_auth, edit_auth])
        
        user_data = {
            'username': username,
            'password': password,
            'person': person,
            'authorization': auth,
            'history_id': f"{uuid.uuid4().hex}user"
        }
        users.append(user_data)
    
    # Insert users
    created_users = []
    for user_data in users:
        # Skip if a user with this person already exists
        person = user_data['person']
        if User.objects.filter(person=person).exists():
            print(f"User already exists for {person}, skipping")
            continue
            
        password = user_data.pop('password')
        user = User.objects.create_user(**user_data)
        user.set_password(password)
        user.save()
        created_users.append(user)
    
    print(f"Created {len(created_users)} users")
    return created_users

if __name__ == "__main__":
    seed_users()
