"""
Seeder for Person model
"""
import os
import django
import uuid
from faker import Faker

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'apqp_manager.settings')
django.setup()

from django.db import transaction
from core.models import Person, Team, Department

fake = Faker()

@transaction.atomic
def seed_persons():
    """Seed person data"""
    print("Seeding persons...")
    
    # Clear existing data
    Person.objects.all().delete()
    
    # Get teams and departments
    teams = list(Team.objects.all())
    departments = list(Department.objects.all())
    
    if not teams or not departments:
        print("Error: Teams and Departments must be seeded first")
        return
    
    # Create persons
    persons = []
    
    # Create 20 persons
    for i in range(20):
        # Generate a unique contact_id for each person
        # This is important to avoid the duplicate key error
        history_id = f"{uuid.uuid4().hex}person"
        contact_id = f"{uuid.uuid4().hex}person"
        
        person_data = {
            'first_name': fake.first_name(),
            'last_name': fake.last_name(),
            'contact_id': contact_id,  # Set a unique contact_id
            'team': fake.random_element(teams),
            'department': fake.random_element(departments),
            'is_user': fake.boolean(chance_of_getting_true=70),
            'history_id': history_id
        }
        
        persons.append(person_data)
    
    # Add specific persons for admin, engineer, and quality roles
    admin_person = {
        'first_name': 'Admin',
        'last_name': 'User',
        'contact_id': f"{uuid.uuid4().hex}person",
        'team': Team.objects.get(name='Management Team'),
        'department': Department.objects.get(name='Management'),
        'is_user': True,
        'history_id': f"{uuid.uuid4().hex}person"
    }
    
    engineer_person = {
        'first_name': 'John',
        'last_name': 'Engineer',
        'contact_id': f"{uuid.uuid4().hex}person",
        'team': Team.objects.get(name='Engineering Team'),
        'department': Department.objects.get(name='Engineering'),
        'is_user': True,
        'history_id': f"{uuid.uuid4().hex}person"
    }
    
    quality_person = {
        'first_name': 'Jane',
        'last_name': 'Quality',
        'contact_id': f"{uuid.uuid4().hex}person",
        'team': Team.objects.get(name='Quality Team'),
        'department': Department.objects.get(name='Quality'),
        'is_user': True,
        'history_id': f"{uuid.uuid4().hex}person"
    }
    
    persons.extend([admin_person, engineer_person, quality_person])
    
    # Insert persons
    created_persons = []
    for person_data in persons:
        created_persons.append(Person.objects.create(**person_data))
    
    print(f"Created {len(created_persons)} persons")
    return created_persons

if __name__ == "__main__":
    seed_persons()
