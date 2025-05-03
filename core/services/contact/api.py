from core.models import Contact
from core.services.contact.initialization import initialize_contact
from core.services.contact.functions import (
    get_contact_by_id,
    update_contact_address,
    update_contact_email,
    update_contact_phone,
    check_contact_dependencies,
    get_person_by_contact,
    get_client_by_contact
)

def update_contact(contact, address=None, email=None, phone=None):
    """
    Update contact
    
    Args:
        contact (Contact): Contact to update
        address (str, optional): New address
        email (str, optional): New email
        phone (str, optional): New phone
        
    Returns:
        Contact: Updated contact
    """
    if address is not None:
        update_contact_address(contact, address)
    
    if email is not None:
        update_contact_email(contact, email)
    
    if phone is not None:
        update_contact_phone(contact, phone)
    
    return contact

def delete_contact(contact):
    """
    Delete contact
    
    Args:
        contact (Contact): Contact to delete
        
    Raises:
        ValueError: If contact has dependencies
    """
    if check_contact_dependencies(contact):
        raise ValueError("Cannot delete contact with dependencies")
    
    contact.delete()
