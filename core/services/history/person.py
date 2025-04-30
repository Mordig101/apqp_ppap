# Person history tracking
from core.models import History, Person
from core.services.history.initialization import initialize_history

def record_person_creation(person):
    """
    Record person creation in history
    """
    initialize_history(
        title=f"{person.first_name} {person.last_name}",
        event=f"Person created with ID {person.id}",
        table_name='person',
        history_id=person.history_id
    )

def record_person_update(person, updated_fields):
    """
    Record person update in history
    """
    initialize_history(
        title=f"{person.first_name} {person.last_name}",
        event=f"Person updated: {', '.join(updated_fields)}",
        table_name='person',
        history_id=person.history_id
    )

def record_person_team_change(person, old_team_id, new_team_id):
    """
    Record person team change in history
    """
    old_team = "None" if not old_team_id else f"Team {old_team_id}"
    new_team = "None" if not new_team_id else f"Team {new_team_id}"
    
    initialize_history(
        title=f"{person.first_name} {person.last_name}",
        event=f"Person team changed from {old_team} to {new_team}",
        table_name='person',
        history_id=person.history_id
    )

def record_person_department_change(person, old_department_id, new_department_id):
    """
    Record person department change in history
    """
    old_department = "None" if not old_department_id else f"Department {old_department_id}"
    new_department = "None" if not new_department_id else f"Department {new_department_id}"
    
    initialize_history(
        title=f"{person.first_name} {person.last_name}",
        event=f"Person department changed from {old_department} to {new_department}",
        table_name='person',
        history_id=person.history_id
    )

def record_person_deletion(person):
    """
    Record person deletion in history
    """
    initialize_history(
        title=f"{person.first_name} {person.last_name}",
        event=f"Person deleted with ID {person.id}",
        table_name='person',
        history_id=person.history_id
    )

def get_person_history(person_id):
    """
    Get complete history for a person
    """
    person = Person.objects.get(id=person_id)
    history_records = History.objects.filter(id=person.history_id).order_by('-created_at')
    return history_records
