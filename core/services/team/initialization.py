from core.models import Team
import uuid

def initialize_team(name, description='' ,is_user_team=False):
    """
    Initialize a new team
    
    Args:
        name (str): Team name
        description (str): Team description
    
    Returns:
        Team: The created team
    """
    # Generate unique history ID
    
    team = Team.objects.create(
        name=name,
        description=description,
        is_user_team=is_user_team,
    )
    
    return team
