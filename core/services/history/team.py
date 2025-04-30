# Team history tracking
from core.models import History, Team
from core.services.history.initialization import initialize_history

def record_team_creation(team):
    """
    Record team creation in history
    """
    initialize_history(
        title=team.name,
        event=f"Team created with ID {team.id}",
        table_name='team',
        history_id=team.history_id
    )

def record_team_update(team, updated_fields):
    """
    Record team update in history
    """
    initialize_history(
        title=team.name,
        event=f"Team updated: {', '.join(updated_fields)}",
        table_name='team',
        history_id=team.history_id
    )

def record_team_member_addition(team, person_id):
    """
    Record team member addition in history
    """
    initialize_history(
        title=team.name,
        event=f"Person {person_id} added to team",
        table_name='team',
        history_id=team.history_id
    )

def record_team_member_removal(team, person_id):
    """
    Record team member removal in history
    """
    initialize_history(
        title=team.name,
        event=f"Person {person_id} removed from team",
        table_name='team',
        history_id=team.history_id
    )

def record_team_deletion(team):
    """
    Record team deletion in history
    """
    initialize_history(
        title=team.name,
        event=f"Team deleted with ID {team.id}",
        table_name='team',
        history_id=team.history_id
    )

def get_team_history(team_id):
    """
    Get complete history for a team
    """
    try:
        team = Team.objects.get(id=team_id)
        history_records = History.objects.filter(history_id=team.history_id).order_by('-created_at')
        
        # Convert to a list of dictionaries for API response
        history_data = []
        for record in history_records:
            history_data.append({
                'id': record.id,
                'title': record.title,
                'event': record.event,
                'created_at': record.created_at,
                'created_by': record.created_by,
                'table_name': record.table_name
            })
        
        return history_data
    except Team.DoesNotExist:
        return []
    except Exception as e:
        return []
