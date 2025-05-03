from core.models import Contact
import uuid

def initialize_contact(address='', email='', phone='', type='person'):
    """
    Initialize a new contact
    
    Args:
        address (str, optional): Contact address
        email (str, optional): Contact email
        phone (str, optional): Contact phone
        type (str, optional): Contact type (person, client, client_member)
        
    Returns:
        Contact: The created contact
    """
    contact = Contact.objects.create(
        id=str(uuid.uuid4()),
        address=address,
        email=email,
        phone=phone,
        type=type
    )
    
    return contact
