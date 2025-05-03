from core.models import Client, Project, Contact
from core.services.history.client import (
    record_client_creation,
    record_client_update,
    record_client_deletion,
    get_client_history
)

def get_client_by_id(client_id):
    """
    Get client by ID
    
    Args:
        client_id (int): Client ID
    
    Returns:
        Client: The client object
    """
    return Client.objects.get(id=client_id)

def get_clients_by_name(name):
    """
    Search clients by name
    
    Args:
        name (str): Search term
    
    Returns:
        QuerySet: Clients matching the search term
    """
    return Client.objects.filter(name__icontains=name)

def get_clients_by_code(code_value):
    """
    Search clients by code value
    
    Args:
        code_value (str): Code value to search for
    
    Returns:
        list: Clients with matching code value
    """
    # Since code is stored as JSON, we need to filter in Python
    all_clients = Client.objects.all()
    matching_clients = []
    
    for client in all_clients:
        for key, value in client.code.items():
            if str(value).lower() == str(code_value).lower():
                matching_clients.append(client)
                break
    
    return matching_clients

def update_client(client, name=None, address=None, code=None, description=None):
    """
    Update client information
    
    Args:
        client: Client object
        name (str): New name (if None, keep existing)
        address (str): New address (if None, keep existing)
        code (dict): New code information (if None, keep existing)
        description (str): New description (if None, keep existing)
    
    Returns:
        Client: The updated client
    """
    updated_fields = []
    
    if name is not None and name != client.name:
        client.name = name
        updated_fields.append('name')
    
    if address is not None and address != client.address:
        client.address = address
        updated_fields.append('address')
    
    if code is not None and code != client.code:
        client.code = code
        updated_fields.append('code')
    
    if description is not None and description != client.description:
        client.description = description
        updated_fields.append('description')
    
    if updated_fields:
        client.save()
        record_client_update(client, updated_fields)
    
    return client

def delete_client(client):
    """
    Delete a client
    
    Args:
        client: Client object
    """
    # Check for projects associated with this client
    projects_count = Project.objects.filter(client=client).count()
    if projects_count > 0:
        raise ValueError(f"Cannot delete client. It is associated with {projects_count} projects.")
    
    record_client_deletion(client)
    
    # Delete associated contact
    try:
        contact = Contact.objects.get(id=client.contact_id)
        contact.delete()
    except Contact.DoesNotExist:
        pass
    
    client.delete()

def get_client_projects(client_id):
    """
    Get all projects for a client
    
    Args:
        client_id (int): Client ID
    
    Returns:
        QuerySet: Projects for the client
    """
    return Project.objects.filter(client_id=client_id)
