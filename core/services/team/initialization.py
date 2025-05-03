from core.models import Team
import uuid

def initialize_team(name, description=''):
    """
    Initialize a new team
    
    Args:
        name (str): Team name
        description (str): Team description
    
    Returns:
        Team: The created team
    """
    # Generate unique history ID
    history_id = f"{uuid.uuid4().hex}team"
    
    team = Team.objects.create(
        name=name,
        description=description,
        history_id=history_id
    )
    
    return team
