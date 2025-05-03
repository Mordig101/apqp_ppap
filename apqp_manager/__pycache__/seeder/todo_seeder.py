"""
Seeder for Todo model
"""
import os
import django
from faker import Faker

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'apqp_manager.settings')
django.setup()

from django.db import transaction
from core.models import Todo, User, Output, Permission

fake = Faker()

@transaction.atomic
def seed_todos():
    """Seed todo data"""
    print("Seeding todos...")
    
    # Clear existing data
    Todo.objects.all().delete()
    
    # Get users, outputs, and permissions
    users = User.objects.all()
    outputs = Output.objects.filter(status__in=['Not Started', 'In Progress'])
    read_permission = Permission.objects.get(name='r')
    edit_permission = Permission.objects.get(name='e')
    
    if not users or not outputs or not read_permission or not edit_permission:
        print("Error: Users, Outputs, and Permissions must be seeded first")
        return
    
    # Create todos
    todos = []
    
    # Assign todos to output owners (edit permission)
    for output in outputs:
        if output.user:
            todo_data = {
                'permission': edit_permission,
                'user': output.user,
                'output': output
            }
            todos.append(Todo.objects.create(**todo_data))
    
    # Assign additional todos to random users (read permission)
    for i in range(30):
        user = fake.random_element(users)
        output = fake.random_element(outputs)
        
        # Skip if user already has a todo for this output
        if Todo.objects.filter(user=user, output=output).exists():
            continue
        
        todo_data = {
            'permission': read_permission,
            'user': user,
            'output': output
        }
        todos.append(Todo.objects.create(**todo_data))
    
    print(f"Created {len(todos)} todos")
    return todos

if __name__ == "__main__":
    seed_todos()
