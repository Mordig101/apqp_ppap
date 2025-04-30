"""
Seeder for History model
"""
import os
import sys
import django
from faker import Faker
from datetime import datetime, timedelta

# Add parent directory to path so Django can find the settings module
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'apqp_manager.settings')
django.setup()

from django.db import transaction
from django.utils import timezone
from core.models import History, Project, PPAP, Phase, Output, Document, User, Client, Team, Person, Contact, Department

fake = Faker()

# Helper function to make datetime timezone-aware
def make_aware(dt):
    return timezone.make_aware(dt) if dt else None

@transaction.atomic
def seed_histories():
    """Seed history data"""
    print("Seeding histories...")
    
    # Clear existing data
    History.objects.all().delete()
    
    # Get all entities with history_id
    projects = Project.objects.all()
    ppaps = PPAP.objects.all()
    phases = Phase.objects.all()
    outputs = Output.objects.all()
    documents = Document.objects.all()
    users = User.objects.all()
    clients = Client.objects.all()
    teams = Team.objects.all()
    persons = Person.objects.all()
    contacts = Contact.objects.all()
    departments = Department.objects.all()
    
    # Create histories
    histories = []
    
    # Project histories
    for project in projects:
        # Creation event
        created_at = make_aware(fake.date_time_between(start_date='-1y', end_date='-6m'))
        
        history_data = {
            'id': project.history_id,
            'title': project.name,
            'event': f"Project created with ID {project.id}",
            'table_name': 'project',
            'created_at': created_at,
            'started_at': created_at if project.status != 'Planning' else None,
            'updated_at': make_aware(fake.date_time_between(start_date=created_at, end_date='now')) if project.status != 'Planning' else None,
            'deadline': make_aware(fake.date_time_between(start_date='+1m', end_date='+6m')),
            'finished_at': make_aware(fake.date_time_between(start_date='-3m', end_date='-1m')) if project.status in ['Completed', 'Archived'] else None
        }
        
        histories.append(History.objects.create(**history_data))
    
    # PPAP histories
    for ppap in ppaps:
        # Creation event
        project_history = History.objects.get(id=ppap.project.history_id)
        created_at = project_history.created_at
        
        history_data = {
            'id': ppap.history_id,
            'title': f"PPAP for Project {ppap.project_id}",
            'event': f"PPAP created with level {ppap.level}",
            'table_name': 'ppap',
            'created_at': created_at,
            'started_at': created_at if ppap.status != 'Not Started' else None,
            'updated_at': make_aware(fake.date_time_between(start_date=created_at, end_date='now')) if ppap.status != 'Not Started' else None,
            'deadline': project_history.deadline,
            'finished_at': make_aware(fake.date_time_between(start_date='-3m', end_date='-1m')) if ppap.status in ['Completed', 'Approved'] else None
        }
        
        histories.append(History.objects.create(**history_data))
    
    # Phase histories
    for phase in phases:
        # Creation event
        ppap_history = History.objects.get(id=phase.ppap.history_id)
        created_at = ppap_history.created_at
        
        # Calculate phase deadline based on template order
        total_phases = Phase.objects.filter(ppap=phase.ppap).count()
        phase_duration = (ppap_history.deadline - created_at) / total_phases
        phase_deadline = created_at + (phase_duration * phase.template.order)
        
        history_data = {
            'id': phase.history_id,
            'title': f"{phase.template.name} for PPAP {phase.ppap_id}",
            'event': f"Phase created based on template {phase.template.id}",
            'table_name': 'phase',
            'created_at': created_at,
            'started_at': created_at if phase.status != 'Not Started' else None,
            'updated_at': make_aware(fake.date_time_between(start_date=created_at, end_date='now')) if phase.status != 'Not Started' else None,
            'deadline': phase_deadline,
            'finished_at': make_aware(fake.date_time_between(start_date='-3m', end_date='-1m')) if phase.status == 'Completed' else None
        }
        
        histories.append(History.objects.create(**history_data))
    
    # Output histories
    for output in outputs:
        # Creation event
        phase_history = History.objects.get(id=output.phase.history_id)
        created_at = phase_history.created_at
        
        # Calculate output deadline
        total_outputs = Output.objects.filter(phase=output.phase).count()
        output_duration = (phase_history.deadline - created_at) / total_outputs
        output_deadline = created_at + output_duration
        
        history_data = {
            'id': output.history_id,
            'title': f"{output.template.name} for Phase {output.phase_id}",
            'event': f"Output created based on template {output.template.id}",
            'table_name': 'output',
            'created_at': created_at,
            'started_at': created_at if output.status != 'Not Started' else None,
            'updated_at': make_aware(fake.date_time_between(start_date=created_at, end_date='now')) if output.status != 'Not Started' else None,
            'deadline': output_deadline,
            'finished_at': make_aware(fake.date_time_between(start_date='-3m', end_date='-1m')) if output.status == 'Completed' else None
        }
        
        histories.append(History.objects.create(**history_data))
    
    # Document histories
    for document in documents:
        # Creation event
        output_history = History.objects.get(id=document.output.history_id)
        created_at = make_aware(fake.date_time_between(start_date=output_history.created_at, end_date='now'))
        
        history_data = {
            'id': document.history_id,
            'title': document.name,
            'event': f"Document uploaded for Output {document.output_id}",
            'table_name': 'document',
            'created_at': created_at,
            'updated_at': make_aware(fake.date_time_between(start_date=created_at, end_date='now')) if document.status != 'Draft' else None,
            'deadline': output_history.deadline,
            'finished_at': make_aware(fake.date_time_between(start_date=created_at, end_date='now')) if document.status == 'Approved' else None
        }
        
        histories.append(History.objects.create(**history_data))
    
    # Other entity histories (simplified)
    for entity, table_name in [
        (users, 'user'),
        (clients, 'client'),
        (teams, 'team'),
        (persons, 'person'),
        (contacts, 'contact'),
        (departments, 'department')
    ]:
        for item in entity:
            created_at = make_aware(fake.date_time_between(start_date='-1y', end_date='-6m'))
            
            history_data = {
                'id': item.history_id,
                'title': str(item),
                'event': f"{table_name.capitalize()} created",
                'table_name': table_name,
                'created_at': created_at,
                'updated_at': make_aware(fake.date_time_between(start_date=created_at, end_date='now')) if fake.boolean(chance_of_getting_true=30) else None
            }
            
            histories.append(History.objects.create(**history_data))
    
    print(f"Created {len(histories)} history records")
    return histories

if __name__ == "__main__":
    seed_histories()
