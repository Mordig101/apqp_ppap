"""
Seeder for OutputTemplate model
"""
import os
import django
from faker import Faker

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'apqp_manager.settings')
django.setup()

from django.db import transaction
from core.models import OutputTemplate, PhaseTemplate, PPAPElement

fake = Faker()

@transaction.atomic
def seed_output_templates():
    """Seed output template data"""
    print("Seeding output templates...")
    
    # Clear existing data
    OutputTemplate.objects.all().delete()
    
    # Get phase templates and PPAP elements
    phase_templates = PhaseTemplate.objects.all()
    ppap_elements = PPAPElement.objects.all()
    
    if not phase_templates or not ppap_elements:
        print("Error: Phase templates and PPAP elements must be seeded first")
        return
    
    # Create output templates for each phase
    output_templates = []
    
    # Phase 1: Prepare for APQP
    phase1 = PhaseTemplate.objects.get(name='Prepare for APQP')
    output_templates.extend([
        {
            'name': 'Team Organization',
            'configuration': {},
            'phase': phase1,
            'ppap_element': PPAPElement.objects.get(name='Customer-Specific Requirements')
        },
        {
            'name': 'Project Scope Definition',
            'configuration': {},
            'phase': phase1,
            'ppap_element': PPAPElement.objects.get(name='Customer-Specific Requirements')
        },
        {
            'name': 'Team Communication Plan',
            'configuration': {},
            'phase': phase1,
            'ppap_element': PPAPElement.objects.get(name='Customer-Specific Requirements')
        },
        {
            'name': 'Core Tools Training',
            'configuration': {},
            'phase': phase1,
            'ppap_element': PPAPElement.objects.get(name='Customer-Specific Requirements')
        }
    ])
    
    # Phase 2: Plan and Define Program
    phase2 = PhaseTemplate.objects.get(name='Plan and Define Program')
    output_templates.extend([
        {
            'name': 'Voice of Customer',
            'configuration': {},
            'phase': phase2,
            'ppap_element': PPAPElement.objects.get(name='Customer-Specific Requirements')
        },
        {
            'name': 'Business Plan',
            'configuration': {},
            'phase': phase2,
            'ppap_element': PPAPElement.objects.get(name='Customer-Specific Requirements')
        },
        {
            'name': 'Product/Process Benchmark',
            'configuration': {},
            'phase': phase2,
            'ppap_element': PPAPElement.objects.get(name='Customer-Specific Requirements')
        },
        {
            'name': 'Reliability Studies',
            'configuration': {},
            'phase': phase2,
            'ppap_element': PPAPElement.objects.get(name='Design FMEA')
        }
    ])
    
    # Phase 3: Product Design and Development
    phase3 = PhaseTemplate.objects.get(name='Product Design and Development')
    output_templates.extend([
        {
            'name': 'Design Goals',
            'configuration': {},
            'phase': phase3,
            'ppap_element': PPAPElement.objects.get(name='Design Records')
        },
        {
            'name': 'Preliminary Bill of Material',
            'configuration': {},
            'phase': phase3,
            'ppap_element': PPAPElement.objects.get(name='Design Records')
        },
        {
            'name': 'Design FMEA',
            'configuration': {},
            'phase': phase3,
            'ppap_element': PPAPElement.objects.get(name='Design FMEA')
        },
        {
            'name': 'Design Verification Plan',
            'configuration': {},
            'phase': phase3,
            'ppap_element': PPAPElement.objects.get(name='Design Records')
        }
    ])
    
    # Phase 4: Process Design and Development
    phase4 = PhaseTemplate.objects.get(name='Process Design and Development')
    output_templates.extend([
        {
            'name': 'Packaging Standards',
            'configuration': {},
            'phase': phase4,
            'ppap_element': PPAPElement.objects.get(name='Process Flow Diagrams')
        },
        {
            'name': 'Process Flow Chart',
            'configuration': {},
            'phase': phase4,
            'ppap_element': PPAPElement.objects.get(name='Process Flow Diagrams')
        },
        {
            'name': 'Floor Plan Layout',
            'configuration': {},
            'phase': phase4,
            'ppap_element': PPAPElement.objects.get(name='Process Flow Diagrams')
        },
        {
            'name': 'Process FMEA',
            'configuration': {},
            'phase': phase4,
            'ppap_element': PPAPElement.objects.get(name='Process FMEA')
        },
        {
            'name': 'Control Plan',
            'configuration': {},
            'phase': phase4,
            'ppap_element': PPAPElement.objects.get(name='Control Plan')
        }
    ])
    
    # Phase 5: Product and Process Validation
    phase5 = PhaseTemplate.objects.get(name='Product and Process Validation')
    output_templates.extend([
        {
            'name': 'Production Trial Run',
            'configuration': {},
            'phase': phase5,
            'ppap_element': PPAPElement.objects.get(name='Sample Production Parts')
        },
        {
            'name': 'Measurement Systems Evaluation',
            'configuration': {},
            'phase': phase5,
            'ppap_element': PPAPElement.objects.get(name='Measurement System Analysis Studies')
        },
        {
            'name': 'Process Capability Study',
            'configuration': {},
            'phase': phase5,
            'ppap_element': PPAPElement.objects.get(name='Initial Process Studies')
        },
        {
            'name': 'Production Part Approval',
            'configuration': {},
            'phase': phase5,
            'ppap_element': PPAPElement.objects.get(name='Part Submission Warrant')
        },
        {
            'name': 'Production Validation Testing',
            'configuration': {},
            'phase': phase5,
            'ppap_element': PPAPElement.objects.get(name='Material, Performance Test Results')
        }
    ])
    
    # Phase 6: Feedback, Assessment and Corrective Action
    phase6 = PhaseTemplate.objects.get(name='Feedback, Assessment and Corrective Action')
    output_templates.extend([
        {
            'name': 'Variation Reduction',
            'configuration': {},
            'phase': phase6,
            'ppap_element': PPAPElement.objects.get(name='Initial Process Studies')
        },
        {
            'name': 'Customer Satisfaction Survey',
            'configuration': {},
            'phase': phase6,
            'ppap_element': PPAPElement.objects.get(name='Customer-Specific Requirements')
        },
        {
            'name': 'Delivery Performance',
            'configuration': {},
            'phase': phase6,
            'ppap_element': PPAPElement.objects.get(name='Customer-Specific Requirements')
        },
        {
            'name': 'Corrective Action Plan',
            'configuration': {},
            'phase': phase6,
            'ppap_element': PPAPElement.objects.get(name='Customer-Specific Requirements')
        }
    ])
    
    # Insert output templates
    created_templates = []
    for template_data in output_templates:
        created_templates.append(OutputTemplate.objects.create(**template_data))
    
    print(f"Created {len(created_templates)} output templates")
    return created_templates

if __name__ == "__main__":
    seed_output_templates()
