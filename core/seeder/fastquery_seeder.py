"""
Seeder for FastQuery model
"""
import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'apqp_manager.settings')
django.setup()

from django.db import transaction
from core.models import FastQuery, Project, PPAP, Phase, Output

@transaction.atomic
def seed_fastqueries():
    """Seed fastquery data"""
    print("Seeding fastqueries...")
    
    # Clear existing data
    FastQuery.objects.all().delete()
    
    # Get projects
    projects = Project.objects.all()
    
    if not projects:
        print("Error: Projects must be seeded first")
        return
    
    # Create fastqueries for each project
    fastqueries = []
    
    for project in projects:
        # Get PPAP, phases, and outputs for this project
        ppap = project.ppap
        
        if not ppap:
            continue
        
        phases = Phase.objects.filter(ppap=ppap)
        
        # Collect all related IDs
        phase_ids = list(phases.values_list('id', flat=True))
        
        output_ids = []
        for phase in phases:
            outputs = Output.objects.filter(phase=phase)
            output_ids.extend(list(outputs.values_list('id', flat=True)))
        
        # Create index
        index = {
            'project_id': project.id,
            'ppap_id': ppap.id,
            'phase_ids': phase_ids,
            'output_ids': output_ids
        }
        
        # Create fastquery
        fastquery = FastQuery.objects.create(
            project=project,
            index=index
        )
        
        fastqueries.append(fastquery)
    
    print(f"Created {len(fastqueries)} fastqueries")
    return fastqueries

if __name__ == "__main__":
    seed_fastqueries()
