from core.models import Client
import uuid

def initialize_client(name, address, code=None, description='', team=None):
    """
    Initialize a new client
    
    Args:
        name (str): Client name
        address (str): Client address
        code (dict): Client code information (fiscal code, DUNS, etc.)
        description (str): Client description
        team (Team, optional): Team associated with the client
    
    Returns:
        Client: The created client
    """
    if code is None:
        code = {}
    
    # First create the client - the save() method will generate IDs
    client = Client.objects.create(
        name=name,
        address=address,
        code=code,
        description=description,
        team=team
    )
    
    return client
