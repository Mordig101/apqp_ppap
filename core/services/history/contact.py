from core.models import Contact
from django.utils import timezone
from core.services.history.initialization import (
    get_history, initialize_history, add_history_event, ensure_history_id
)

def record_contact_creation(contact):
    """
    Record contact creation in history
    
    Args:
        contact (Contact): Created contact
        
    Returns:
        History: Created history record
    """
    # Ensure contact has a history_id
    ensure_history_id(contact)
    
    # Initialize a new history record
    history = initialize_history(
        title=f"Contact {contact.email}",
        event_type="create",
        event_details=f"Contact created with ID {contact.id}",
        table_name='contact',
        history_id=contact.history_id
    )
    
    return history

def record_contact_update(contact, updated_fields=None):
    """
    Record contact update in history
    
    Args:
        contact (Contact): Updated contact
        updated_fields (list, optional): List of updated fields
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(contact)
    
    if not history:
        return None
    
    # Add update event
    if updated_fields:
        event_details = f"Contact updated. Fields changed: {', '.join(updated_fields)}"
    else:
        event_details = "Contact updated."
    
    # Make sure title stays updated with current email
    history.title = f"Contact {contact.email}"
    history.save(update_fields=['title'])
    
    return add_history_event(history, "update", event_details)

def record_contact_email_change(contact, old_email, new_email):
    """
    Record contact email change in history
    
    Args:
        contact (Contact): Contact object
        old_email (str): Previous email address
        new_email (str): New email address
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(contact)
    
    if not history:
        return None
    
    # Update the title to reflect the new email
    history.title = f"Contact {new_email}"
    history.save(update_fields=['title'])
    
    # Add email change event
    event_details = f"Email changed from '{old_email}' to '{new_email}'"
    
    return add_history_event(history, "email_change", event_details)

def record_contact_address_change(contact, old_address, new_address):
    """
    Record contact address change in history
    
    Args:
        contact (Contact): Contact object
        old_address (str): Previous address
        new_address (str): New address
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(contact)
    
    if not history:
        return None
    
    # Add address change event
    event_details = f"Address updated"
    
    # If addresses are short enough, include them in the details
    if len(old_address) + len(new_address) < 200:
        event_details = f"Address changed from '{old_address}' to '{new_address}'"
    
    return add_history_event(history, "address_change", event_details)

def record_contact_phone_change(contact, old_phone, new_phone):
    """
    Record contact phone change in history
    
    Args:
        contact (Contact): Contact object
        old_phone (str): Previous phone number
        new_phone (str): New phone number
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(contact)
    
    if not history:
        return None
    
    # Add phone change event
    event_details = f"Phone changed from '{old_phone}' to '{new_phone}'"
    
    return add_history_event(history, "phone_change", event_details)

def record_contact_deletion(contact):
    """
    Record contact deletion in history
    
    Args:
        contact (Contact): Deleted contact
        
    Returns:
        History: Updated history record or None if no history exists
    """
    # Get existing history record
    history = get_history(contact)
    
    if not history:
        return None
    
    # Add deletion event
    event_details = f"Contact with ID {contact.id} deleted"
    
    return add_history_event(history, "delete", event_details)

def get_contact_history(contact_id):
    """
    Get history record for a contact
    
    Args:
        contact_id (str): Contact ID
        
    Returns:
        History or None: Contact history record if found, None otherwise
    """
    try:
        contact = Contact.objects.get(id=contact_id)
        return get_history(contact)
    except Contact.DoesNotExist:
        return None
