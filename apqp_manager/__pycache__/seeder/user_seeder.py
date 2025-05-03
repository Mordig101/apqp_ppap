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
from core.models import User, Person, Authorization

fake = Faker()

@transaction.atomic
def seed_users():
    """Seed user data"""
    print("Seeding users...")
    
    # Clear existing data
    User.objects.all().delete()
    
    # Get persons who are users and authorizations
    persons = Person.objects.filter(is_user=True)
    authorizations = Authorization.objects.all()
    
    if not persons or not authorizations:
        print("Error: Persons and Authorizations must be seeded first")
        return
    
    admin_auth = Authorization.objects.get(name='admin')
    create_auth = Authorization.objects.get(name='create')
    edit_auth = Authorization.objects.get(name='edit')
    
    # Create users
    users = []
    
    # Create admin user
    admin_person = Person.objects.get(first_name='Admin', last_name='User')
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
    engineer_person = Person.objects.get(first_name='John', last_name='Engineer')
    engineer_user = {
        'username': 'john',
        'password': 'john123',
        'person': engineer_person,
        'authorization': edit_auth,
        'history_id': f"{uuid.uuid4().hex}user"
    }
    users.append(engineer_user)
    
    # Create quality user
    quality_person = Person.objects.get(first_name='Jane', last_name='Quality')
    quality_user = {
        'username': 'jane',
        'password': 'jane123',
        'person': quality_person,
        'authorization': edit_auth,
        'history_id': f"{uuid.uuid4().hex}user"
    }
    users.append(quality_user)
    
    # Create additional users for other persons
    other_persons = persons.exclude(id__in=[admin_person.id, engineer_person.id, quality_person.id])
    
    for person in other_persons:
        username = f"{person.first_name.lower()}.{person.last_name.lower()}"
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
        password = user_data.pop('password')
        user = User.objects.create_user(**user_data)
        user.set_password(password)
        user.save()
        created_users.append(user)
    
    print(f"Created {len(created_users)} users")
    return created_users

if __name__ == "__main__":
    seed_users()
