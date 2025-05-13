"""
Seeder for Person model
"""
import os
import django
import uuid
import random
from faker import Faker

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'apqp_manager.settings')
django.setup()

from django.db import transaction
from core.models import Person, Department, Team

fake = Faker()

@transaction.atomic
def seed_persons(num_persons=20):
    """Seed person data with roles and replacers"""
    print("Seeding persons...")
    
    # Always create Admin User first
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
    
    # Make sure we have departments and teams first
    departments = list(Department.objects.all())
    teams = list(Team.objects.all())
    
    if not departments:
        print("No departments found. Please run department seeder first.")
        return []
        
    if not teams:
        print("No teams found. Please run team seeder first.")
        return []
    
    # Clear existing data if needed (optional)
    # Person.objects.all().delete()
    
    # Common job roles
    roles = [
        "Project Manager", 
        "Quality Engineer", 
        "Design Engineer", 
        "Manufacturing Engineer", 
        "Procurement Specialist",
        "Test Engineer", 
        "Product Owner",
        "Quality Assurance Lead", 
        "Technical Lead",
        "Operations Manager"
    ]
    
    # Create persons
    created_persons = []
    for _ in range(num_persons):
        person = Person(
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            department=random.choice(departments),
            is_user=random.choice([True, False]),
            role=random.choice(roles)
            # We'll set replacer after creating all persons
        )
        person.save()  # This calls the custom save method that sets contact_id and history_id
        
        # Assign to 1-3 random teams
        num_teams = random.randint(1, 3)
        selected_teams = random.sample(teams, min(num_teams, len(teams)))
        person.teams.set(selected_teams)
        
        created_persons.append(person)
    
    # Now set replacers (avoiding self-references)
    for person in created_persons:
        # 40% chance of having a replacer
        if random.random() < 0.4:
            possible_replacers = [p for p in created_persons if p.id != person.id]
            if possible_replacers:
                person.replacer = random.choice(possible_replacers)
                person.save()
    
    print(f"Created {len(created_persons)} persons with roles and replacers")
    return created_persons

if __name__ == "__main__":
    seed_persons()
