from core.models import Person
import uuid

def initialize_person(first_name, last_name, is_user=False, department=None):
    """
    Initialize a new person
    
    Args:
        first_name (str): Person's first name
        last_name (str): Person's last name
        is_user (bool): Whether this person is a user
        department: Department object
    
    Returns:
        Person: The created person
    """
    # Generate unique IDs
    history_id = f"{uuid.uuid4().hex}person"
    contact_id = f"{uuid.uuid4().hex}person"
    
    person = Person.objects.create(
        first_name=first_name,
        last_name=last_name,
        is_user=is_user,
        department=department,
        history_id=history_id,
        contact_id=contact_id
    )
    
    return person
