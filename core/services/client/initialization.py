from core.models import Client
import uuid

def initialize_client(name, address, code=None, description=''):
    """
    Initialize a new client
    
    Args:
        name (str): Client name
        address (str): Client address
        code (dict): Client code information (fiscal code, DUNS, etc.)
        description (str): Client description
    
    Returns:
        Client: The created client
    """
    # Generate unique IDs
    history_id = f"{uuid.uuid4().hex}client"
    contact_id = f"{uuid.uuid4().hex}client"
    
    if code is None:
        code = {}
    
    client = Client.objects.create(
        name=name,
        address=address,
        code=code,
        description=description,
        history_id=history_id,
        contact_id=contact_id
    )
    
    return client
