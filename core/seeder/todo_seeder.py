"""
Seeder for Todo model with roles
"""
import os
import django
import random
from faker import Faker

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'apqp_manager.settings')
django.setup()

from django.db import transaction
from core.models import Todo, User, Output, Permission

fake = Faker()

@transaction.atomic
def seed_todos(num_todos=50):
    """Seed todo data with roles"""
    print("Seeding todos...")
    
    # Make sure we have users, outputs and permissions first
    users = list(User.objects.all())
    outputs = list(Output.objects.all())
    
    # Get read and edit permissions
    try:
        read_permission = Permission.objects.get(name='r')
        edit_permission = Permission.objects.get(name='e')
        permissions = [read_permission, edit_permission]
    except Permission.DoesNotExist:
        print("Permissions 'r' and 'e' not found. Please run permission seeder first.")
        return []
    
    if not users:
        print("No users found. Please run user seeder first.")
        return []
        
    if not outputs:
        print("No outputs found. Please run output seeder first.")
        return []
    
    # Define possible roles for todos
    roles = [
        'reviewer', 
        'approver', 
        'contributor', 
        'observer', 
        'responsible', 
        'consultant'
    ]
    
    # Create todos
    created_todos = []
    for _ in range(num_todos):
        # Get random user and output
        user = random.choice(users)
        output = random.choice(outputs)
        permission = random.choice(permissions)
        role = random.choice(roles)
        
        # Check if this user-output combination already exists
        todo_exists = Todo.objects.filter(user=user, output=output).exists()
        
        if not todo_exists:
            todo = Todo.objects.create(
                user=user,
                output=output,
                permission=permission,
                role=role
            )
            created_todos.append(todo)
    
    print(f"Created {len(created_todos)} todos with roles")
    return created_todos

if __name__ == "__main__":
    seed_todos()
