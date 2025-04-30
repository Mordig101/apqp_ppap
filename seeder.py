#!/usr/bin/env python
"""
Seed script to populate the database with initial data
"""
import os
import django
import uuid

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'apqp_manager.settings')
django.setup()

from django.db import transaction
from core.models import (
    Project, PPAP, Phase, Output, Document, User, Client, Team,
    Person, Contact, Department, History, PhaseTemplate, OutputTemplate,
    PPAPElement, Permission, Authorization
)

@transaction.atomic
def seed_database():
    print("Seeding database...")
    
    # Create authorizations
    admin_auth = Authorization.objects.create(
        name="admin",
        history_id=f"{uuid.uuid4().hex}authorization"
    )
    create_auth = Authorization.objects.create(
        name="create",
        history_id=f"{uuid.uuid4().hex}authorization"
    )
    edit_auth = Authorization.objects.create(
        name="edit",
        history_id=f"{uuid.uuid4().hex}authorization"
    )
    print("Created authorizations")
    
    # Create permissions
    read_perm = Permission.objects.create(
        name="r",
        description="Read only",
        history_id=f"{uuid.uuid4().hex}permission"
    )
    edit_perm = Permission.objects.create(
        name="e",
        description="Edit and read",
        history_id=f"{uuid.uuid4().hex}permission"
    )
    print("Created permissions")
    
    # Create departments
    engineering_dept = Department.objects.create(
        name="Engineering",
        history_id=f"{uuid.uuid4().hex}department"
    )
    quality_dept = Department.objects.create(
        name="Quality",
        history_id=f"{uuid.uuid4().hex}department"
    )
    production_dept = Department.objects.create(
        name="Production",
        history_id=f"{uuid.uuid4().hex}department"
    )
    print("Created departments")
    
    # Create teams
    engineering_team = Team.objects.create(
        name="Engineering Team",
        description="Team responsible for engineering tasks",
        history_id=f"{uuid.uuid4().hex}team"
    )
    quality_team = Team.objects.create(
        name="Quality Team",
        description="Team responsible for quality assurance",
        history_id=f"{uuid.uuid4().hex}team"
    )
    project_team = Team.objects.create(
        name="Project Team",
        description="Cross-functional project team",
        history_id=f"{uuid.uuid4().hex}team"
    )
    print("Created teams")
    
    # Create persons and users
    admin_person = Person.objects.create(
        first_name="Admin",
        last_name="User",
        team=project_team,
        department=engineering_dept,
        is_user=True,
        history_id=f"{uuid.uuid4().hex}person"
    )
    
    admin_contact = Contact.objects.create(
        id=admin_person.contact_id,
        address="123 Admin St",
        email="admin@example.com",
        phone="555-1234",
        type="user",
        history_id=f"{uuid.uuid4().hex}contact"
    )
    
    admin_user = User.objects.create_superuser(
        username="admin",
        password="admin123",
        person=admin_person,
        authorization=admin_auth,
        history_id=f"{uuid.uuid4().hex}user"
    )
    
    engineer_person = Person.objects.create(
        first_name="John",
        last_name="Engineer",
        team=engineering_team,
        department=engineering_dept,
        is_user=True,
        history_id=f"{uuid.uuid4().hex}person"
    )
    
    engineer_contact = Contact.objects.create(
        id=engineer_person.contact_id,
        address="456 Engineer St",
        email="john@example.com",
        phone="555-5678",
        type="user",
        history_id=f"{uuid.uuid4().hex}contact"
    )
    
    engineer_user = User.objects.create_user(
        username="john",
        password="john123",
        person=engineer_person,
        authorization=edit_auth,
        history_id=f"{uuid.uuid4().hex}user"
    )
    
    quality_person = Person.objects.create(
        first_name="Jane",
        last_name="Quality",
        team=quality_team,
        department=quality_dept,
        is_user=True,
        history_id=f"{uuid.uuid4().hex}person"
    )
    
    quality_contact = Contact.objects.create(
        id=quality_person.contact_id,
        address="789 Quality St",
        email="jane@example.com",
        phone="555-9012",
        type="user",
        history_id=f"{uuid.uuid4().hex}contact"
    )
    
    quality_user = User.objects.create_user(
        username="jane",
        password="jane123",
        person=quality_person,
        authorization=edit_auth,
        history_id=f"{uuid.uuid4().hex}user"
    )
    print("Created persons and users")
    
    # Create client
    client = Client.objects.create(
        name="Example Client Corp",
        address="123 Client St, Business City, 12345",
        code={"DUNS": "123456789", "Fiscal": "FC-123456"},
        description="An example client company",
        team=project_team,
        history_id=f"{uuid.uuid4().hex}client"
    )
    
    client_contact = Contact.objects.create(
        id=client.contact_id,
        address=client.address,
        email="contact@client.com",
        phone="555-CLIENT",
        type="client",
        history_id=f"{uuid.uuid4().hex}contact"
    )
    print("Created client")
    
    # Create PPAP elements
    for i in range(1, 6):
        PPAPElement.objects.create(
            name=f"PPAP Element {i}",
            level=f"{i}"
        )
    
    custom_element = PPAPElement.objects.create(
        name="Custom PPAP Element",
        level="custom"
    )
    print("Created PPAP elements")
    
    # Create phase templates
    planning_phase = PhaseTemplate.objects.create(
        name="Planning",
        description="Initial planning phase",
        order=1
    )
    
    design_phase = PhaseTemplate.objects.create(
        name="Design",
        description="Product design phase",
        order=2
    )
    
    implementation_phase = PhaseTemplate.objects.create(
        name="Implementation",
        description="Implementation phase",
        order=3
    )
    
    validation_phase = PhaseTemplate.objects.create(
        name="Validation",
        description="Validation and testing phase",
        order=4
    )
    
    approval_phase = PhaseTemplate.objects.create(
        name="Approval",
        description="Final approval phase",
        order=5
    )
    print("Created phase templates")
    
    # Create output templates
    ppap_elements = PPAPElement.objects.all()
    
    # Planning phase outputs
    OutputTemplate.objects.create(
        name="Project Charter",
        configuration={},
        phase=planning_phase,
        ppap_element=ppap_elements[0]
    )
    
    OutputTemplate.objects.create(
        name="Requirements Document",
        configuration={},
        phase=planning_phase,
        ppap_element=ppap_elements[1]
    )
    
    # Design phase outputs
    OutputTemplate.objects.create(
        name="Design Specifications",
        configuration={},
        phase=design_phase,
        ppap_element=ppap_elements[2]
    )
    
    OutputTemplate.objects.create(
        name="Design Review",
        configuration={},
        phase=design_phase,
        ppap_element=ppap_elements[3]
    )
    
    # Implementation phase outputs
    OutputTemplate.objects.create(
        name="Process Flow Diagram",
        configuration={},
        phase=implementation_phase,
        ppap_element=ppap_elements[0]
    )
    
    OutputTemplate.objects.create(
        name="Control Plan",
        configuration={},
        phase=implementation_phase,
        ppap_element=ppap_elements[1]
    )
    
    # Validation phase outputs
    OutputTemplate.objects.create(
        name="Test Results",
        configuration={},
        phase=validation_phase,
        ppap_element=ppap_elements[2]
    )
    
    OutputTemplate.objects.create(
        name="Measurement System Analysis",
        configuration={},
        phase=validation_phase,
        ppap_element=ppap_elements[3]
    )
    
    # Approval phase outputs
    OutputTemplate.objects.create(
        name="Final Approval Document",
        configuration={},
        phase=approval_phase,
        ppap_element=ppap_elements[4]
    )
    
    OutputTemplate.objects.create(
        name="Customer Submission Package",
        configuration={},
        phase=approval_phase,
        ppap_element=ppap_elements[5]
    )
    print("Created output templates")
    
    print("Database seeding completed successfully!")

if __name__ == "__main__":
    seed_database()
