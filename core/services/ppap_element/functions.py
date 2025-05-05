from django.db import transaction
from core.models import PPAPElement

def get_ppap_element_by_id(element_id):
    """
    Get a PPAP element by ID
    
    Args:
        element_id (int): Element ID
        
    Returns:
        PPAPElement: The element object
        
    Raises:
        PPAPElement.DoesNotExist: If element not found
    """
    return PPAPElement.objects.get(id=element_id)

def get_ppap_elements_by_level(level):
    """
    Get PPAP elements for a specific level
    
    Args:
        level (int or str): PPAP level (1-5 or 'custom')
        
    Returns:
        QuerySet: PPAP elements for the given level
    """
    # Convert level to string for comparison
    level_str = str(level)
    
    # Find elements where the level string contains the requested level
    elements = PPAPElement.objects.all()
    
    # Filter in Python since we need to check if level is in a comma-separated list
    return [e for e in elements if level_str in e.level.split(',') or 'custom' in e.level.split(',')]

def create_ppap_element(name, level):
    """
    Create a new PPAP element
    
    Args:
        name (str): Element name
        level (str): Comma-separated list of applicable levels
        
    Returns:
        PPAPElement: Created element
    """
    return PPAPElement.objects.create(
        name=name,
        level=level
    )

def update_ppap_element(element_id, name=None, level=None):
    """
    Update a PPAP element
    
    Args:
        element_id (int): Element ID
        name (str, optional): New name
        level (str, optional): New level
        
    Returns:
        PPAPElement: Updated element
    """
    element = get_ppap_element_by_id(element_id)
    
    if name is not None:
        element.name = name
    
    if level is not None:
        element.level = level
    
    element.save()
    return element

@transaction.atomic
def delete_ppap_element(element_id):
    """
    Delete a PPAP element
    
    Args:
        element_id (int): Element ID
        
    Returns:
        bool: True if deleted, False otherwise
        
    Note:
        This will fail if the element is in use by any output templates.
    """
    try:
        element = get_ppap_element_by_id(element_id)
        element.delete()
        return True
    except Exception:
        return False

def get_all_ppap_elements():
    """
    Get all PPAP elements
    
    Returns:
        QuerySet: All PPAP elements
    """
    return PPAPElement.objects.all()