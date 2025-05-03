from core.models import Contact, Person, Client
from core.services.history.contact import (
    record_contact_creation,
    record_contact_update,
    record_contact_deletion
)

def get_contact_by_id(contact_id):
    """
    Get contact by ID
    
    Args:
        contact_id (str): Contact ID
        
    Returns:
        Contact: The contact object
        
    Raises:
        Contact.DoesNotExist: If contact not found
    """
    return Contact.objects.get(id=contact_id)

def get_contacts_by_type(type):
    """
    Get contacts by type
    
    Args:
        type (str): Contact type
        
    Returns:
        QuerySet: Contacts of the given type
    """
    return Contact.objects.filter(type=type)

def get_person_by_contact(contact_id):
    """
    Get person by contact ID
    
    Args:
        contact_id (str): Contact ID
        
    Returns:
        Person: The person object or None if not found
    """
    try:
        return Person.objects.get(contact_id=contact_id)
    except Person.DoesNotExist:
        return None

def get_client_by_contact(contact_id):
    """
    Get client by contact ID
    
    Args:
        contact_id (str): Contact ID
        
    Returns:
        Client: The client object or None if not found
    """
    try:
        return Client.objects.get(contact_id=contact_id)
    except Client.DoesNotExist:
        return None

def update_contact_address(contact, address):
    """
    Update contact address
    
    Args:
        contact (Contact): Contact to update
        address (str): New address
        
    Returns:
        Contact: Updated contact
    """
    contact.address = address
    contact.save()
    return contact

def update_contact_email(contact, email):
    """
    Update contact email
    
    Args:
        contact (Contact): Contact to update
        email (str): New email
        
    Returns:
        Contact: Updated contact
    """
    contact.email = email
    contact.save()
    return contact

def update_contact_phone(contact, phone):
    """
    Update contact phone
    
    Args:
        contact (Contact): Contact to update
        phone (str): New phone
        
    Returns:
        Contact: Updated contact
    """
    contact.phone = phone
    contact.save()
    return contact

def check_contact_dependencies(contact):
    """
    Check if contact has dependencies
    
    Args:
        contact (Contact): Contact to check
        
    Returns:
        bool: True if contact has dependencies, False otherwise
    """
    # Check if contact is associated with a person
    if get_person_by_contact(contact.id) is not None:
        return True
    
    # Check if contact is associated with a client
    if get_client_by_contact(contact.id) is not None:
        return True
    
    return False

def update_contact(contact, address=None, email=None, phone=None):
    """
    Update contact information
    
    Args:
        contact: Contact object
        address (str): New address (if None, keep existing)
        email (str): New email (if None, keep existing)
        phone (str): New phone (if None, keep existing)
    
    Returns:
        Contact: The updated contact
    """
    updated_fields = []
    
    if address is not None and address != contact.address:
        contact.address = address
        updated_fields.append('address')
    
    if email is not None and email != contact.email:
        contact.email = email
        updated_fields.append('email')
    
    if phone is not None and phone != contact.phone:
        contact.phone = phone
        updated_fields.append('phone')
    
    if updated_fields:
        contact.save()
        record_contact_update(contact, updated_fields)
    
    return contact

def delete_contact(contact):
    """
    Delete a contact
    
    Args:
        contact: Contact object
    """
    record_contact_deletion(contact)
    contact.delete()
