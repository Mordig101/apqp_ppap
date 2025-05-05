from django.db import transaction
from core.models import PPAPElement

@transaction.atomic
def seed_standard_ppap_elements():
    """
    Seed standard PPAP elements according to AIAG standards
    
    Returns:
        list: Created PPAP elements
    """
    # Define standard PPAP elements
    standard_elements = [
        {'name': 'Design Records', 'level': '1,2,3,4,5'},
        {'name': 'Engineering Change Documents', 'level': '1,2,3,4,5'},
        {'name': 'Customer Engineering Approval', 'level': '1,2,3,4,5'},
        {'name': 'Design FMEA', 'level': '2,3,4,5'},
        {'name': 'Process Flow Diagrams', 'level': '2,3,4,5'},
        {'name': 'Process FMEA', 'level': '2,3,4,5'},
        {'name': 'Control Plan', 'level': '2,3,4,5'},
        {'name': 'Measurement System Analysis Studies', 'level': '3,4,5'},
        {'name': 'Dimensional Results', 'level': '3,4,5'},
        {'name': 'Material, Performance Test Results', 'level': '3,4,5'},
        {'name': 'Initial Process Studies', 'level': '3,4,5'},
        {'name': 'Qualified Laboratory Documentation', 'level': '4,5'},
        {'name': 'Appearance Approval Report', 'level': '4,5'},
        {'name': 'Sample Production Parts', 'level': '4,5'},
        {'name': 'Master Sample', 'level': '4,5'},
        {'name': 'Checking Aids', 'level': '5'},
        {'name': 'Records of Compliance', 'level': '5'},
        {'name': 'Customer-Specific Requirements', 'level': '5'},
        {'name': 'Part Submission Warrant', 'level': '1,2,3,4,5'},
    ]
    
    created_elements = []
    
    for element_data in standard_elements:
        element, created = PPAPElement.objects.get_or_create(
            name=element_data['name'],
            defaults={'level': element_data['level']}
        )
        
        if not created:
            # Update the level if the element already existed
            element.level = element_data['level']
            element.save()
            
        created_elements.append(element)
        
    return created_elements