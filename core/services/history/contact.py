# Contact history tracking
from core.models import History, Contact
from core.services.history.initialization import initialize_history

def record_contact_creation(contact):
    """
    Record contact creation in history
    """
    initialize_history(
        title=f"Contact {contact.id}",
        event=f"Contact created for {contact.type}",
        table_name='contact',
        history_id=contact.history_id
    )

def record_contact_update(contact, updated_fields):
    """
    Record contact update in history
    """
    initialize_history(
        title=f"Contact {contact.id}",
        event=f"Contact updated: {', '.join(updated_fields)}",
        table_name='contact',
        history_id=contact.history_id
    )

def record_contact_deletion(contact):
    """
    Record contact deletion in history
    """
    initialize_history(
        title=f"Contact {contact.id}",
        event=f"Contact deleted",
        table_name='contact',
        history_id=contact.history_id
    )

def get_contact_history(contact_id):
    """
    Get complete history for a contact
    """
    contact = Contact.objects.get(id=contact_id)
    history_records = History.objects.filter(id=contact.history_id).order_by('-created_at')
    return history_records
