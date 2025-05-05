from django.db import transaction
from core.models import Authorization, User

def get_authorization_by_id(authorization_id):
    """
    Get an authorization by ID
    
    Args:
        authorization_id (int): Authorization ID
        
    Returns:
        Authorization: The authorization object
        
    Raises:
        Authorization.DoesNotExist: If authorization not found
    """
    return Authorization.objects.get(id=authorization_id)

def get_authorization_by_name(name):
    """
    Get an authorization by name
    
    Args:
        name (str): Authorization name (admin, create, edit)
        
    Returns:
        Authorization: The authorization object
        
    Raises:
        Authorization.DoesNotExist: If authorization not found
    """
    return Authorization.objects.get(name=name)

def create_authorization(name):
    """
    Create a new authorization level
    
    Args:
        name (str): Authorization name
        
    Returns:
        Authorization: Created authorization
    """
    return Authorization.objects.create(name=name)

def update_authorization(authorization_id, name=None):
    """
    Update an authorization
    
    Args:
        authorization_id (int): Authorization ID
        name (str, optional): New name
        
    Returns:
        Authorization: Updated authorization
    """
    authorization = get_authorization_by_id(authorization_id)
    
    if name is not None:
        authorization.name = name
    
    authorization.save()
    return authorization

@transaction.atomic
def delete_authorization(authorization_id):
    """
    Delete an authorization level
    
    Args:
        authorization_id (int): Authorization ID
        
    Returns:
        bool: True if deleted, False if it couldn't be deleted
    """
    try:
        # Check if authorization is in use
        authorization = get_authorization_by_id(authorization_id)
        users_count = User.objects.filter(authorization=authorization).count()
        
        if users_count > 0:
            # Cannot delete authorization in use
            return False
        
        # Delete the authorization
        authorization.delete()
        return True
    except Exception:
        return False

def get_all_authorizations():
    """
    Get all authorization levels
    
    Returns:
        QuerySet: All authorizations
    """
    return Authorization.objects.all()

def assign_user_authorization(user_id, authorization_id):
    """
    Assign an authorization level to a user
    
    Args:
        user_id (int): User ID
        authorization_id (int): Authorization ID
        
    Returns:
        User: Updated user
    """
    user = User.objects.get(id=user_id)
    authorization = get_authorization_by_id(authorization_id)
    
    user.authorization = authorization
    user.save()
    
    return user