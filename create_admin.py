from django.db import transaction
import os
import django
import uuid

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'apqp_manager.settings')
django.setup()

# Import models after Django setup
from core.models import User, Authorization, Person, Department, Team

def create_superuser():
    try:
        with transaction.atomic():
            # 1. Create Authorization
            authorization = Authorization.objects.create(
                name="Admin Authorization",
                history_id=f"{uuid.uuid4().hex}auth"
            )
            print("Authorization created")

            # 2. Create a Department
            department = Department.objects.create(
                name="Administration",
                history_id=f"{uuid.uuid4().hex}dept"
            )
            print("Department created")

            # 3. Create a Team
            team = Team.objects.create(
                name="Admin Team",
                description="Administrative team",
                history_id=f"{uuid.uuid4().hex}team"
            )
            print("Team created")

            # 4. Create Person
            person = Person.objects.create(
                first_name="Admin",
                last_name="User",
                contact_id=f"{uuid.uuid4().hex}contact",
                is_user=True,
                history_id=f"{uuid.uuid4().hex}person",
                department=department,
                team=team
            )
            print("Person created")

            # 5. Create the superuser
            user = User.objects.create_superuser(
                username="admin",
                password="admin123",
                person=person,
                authorization=authorization,
                history_id=f"{uuid.uuid4().hex}user"
            )
            print("Superuser created successfully!")
            print(f"Username: admin")
            print(f"Password: admin123")

    except Exception as e:
        print(f"Error creating superuser: {e}")

if __name__ == "__main__":
    create_superuser()