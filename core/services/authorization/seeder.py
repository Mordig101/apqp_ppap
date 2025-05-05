from django.db import transaction
from core.models import Authorization

@transaction.atomic
def seed_standard_authorizations():
    """
    Seed standard authorization levels
    
    Returns:
        list: Created authorization levels
    """
    # Define standard authorizations
    standard_authorizations = [
        {'name': 'admin'},
        {'name': 'create'},
        {'name': 'edit'}
    ]
    
    created_authorizations = []
    
    for auth_data in standard_authorizations:
        authorization, created = Authorization.objects.get_or_create(
            name=auth_data['name']
        )
        created_authorizations.append(authorization)
        
    return created_authorizations