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
from core.models import Person, Team, Department, Contact
from core.services.contact.initialization import initialize_person_contact

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
        # Generate unique IDs for each person
        history_id = f"{uuid.uuid4().hex}person"
        contact_id = f"{uuid.uuid4().hex}person"
        
        # Create person without teams first
        person = Person.objects.create(
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            contact_id=contact_id,
            department=fake.random_element(departments),
            is_user=fake.boolean(chance_of_getting_true=70),
            history_id=history_id
        )
        
        # Assign 1-3 random teams to each person
        num_teams = fake.random_int(min=1, max=3)
        random_teams = fake.random_elements(elements=teams, length=num_teams, unique=True)
        person.teams.set(random_teams)
        
        # Create contact for person
        initialize_person_contact(
            person=person,
            address=fake.address(),
            email=fake.email(),
            phone=fake.phone_number()
        )
        
        persons.append(person)
    
    # Add specific persons for admin, engineer, and quality roles
    admin_person = Person.objects.create(
        first_name='Admin',
        last_name='User',
        contact_id=f"{uuid.uuid4().hex}person",
        department=Department.objects.get(name='Management'),
        is_user=True,
        history_id=f"{uuid.uuid4().hex}person"
    )
    admin_person.teams.add(Team.objects.get(name='Management Team'))
    initialize_person_contact(
        person=admin_person,
        address=fake.address(),
        email='admin@example.com',
        phone=fake.phone_number()
    )
    
    engineer_person = Person.objects.create(
        first_name='John',
        last_name='Engineer',
        contact_id=f"{uuid.uuid4().hex}person",
        department=Department.objects.get(name='Engineering'),
        is_user=True,
        history_id=f"{uuid.uuid4().hex}person"
    )
    engineer_person.teams.add(Team.objects.get(name='Engineering Team'))
    initialize_person_contact(
        person=engineer_person,
        address=fake.address(),
        email='engineer@example.com',
        phone=fake.phone_number()
    )
    
    quality_person = Person.objects.create(
        first_name='Jane',
        last_name='Quality',
        contact_id=f"{uuid.uuid4().hex}person",
        department=Department.objects.get(name='Quality'),
        is_user=True,
        history_id=f"{uuid.uuid4().hex}person"
    )
    quality_person.teams.add(Team.objects.get(name='Quality Team'))
    initialize_person_contact(
        person=quality_person,
        address=fake.address(),
        email='quality@example.com',
        phone=fake.phone_number()
    )
    
    print(f"Created {len(persons) + 3} persons")
    return persons
