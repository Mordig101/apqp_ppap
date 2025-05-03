from core.models import Person, Team, Department, Output
from core.services.history.person import (
    record_person_creation,
    record_person_update,
    record_person_team_change,
    record_person_department_change,
    record_person_deletion
)

def get_person_by_id(person_id):
    """
    Get person by ID
    
    Args:
        person_id (int): Person ID
    
    Returns:
        Person: The person object
    """
    return Person.objects.get(id=person_id)

def get_persons_by_team(team_id):
    """
    Get persons in a specific team
    
    Args:
        team_id (int): Team ID
    
    Returns:
        QuerySet: Persons in the specified team
    """
    team = Team.objects.get(id=team_id)
    return team.members.all()

def get_persons_by_department(department_id):
    """
    Get persons in a specific department
    
    Args:
        department_id (int): Department ID
    
    Returns:
        QuerySet: Persons in the specified department
    """
    return Person.objects.filter(department_id=department_id)

def get_users():
    """
    Get all persons who are users
    
    Returns:
        QuerySet: Persons with is_user=True
    """
    return Person.objects.filter(is_user=True)

def update_person(person, first_name=None, last_name=None, is_user=None):
    """
    Update person information
    
    Args:
        person: Person object
        first_name (str): New first name (if None, keep existing)
        last_name (str): New last name (if None, keep existing)
        is_user (bool): New is_user status (if None, keep existing)
    
    Returns:
        Person: The updated person
    """
    updated_fields = []
    
    if first_name is not None and first_name != person.first_name:
        person.first_name = first_name
        updated_fields.append('first_name')
    
    if last_name is not None and last_name != person.last_name:
        person.last_name = last_name
        updated_fields.append('last_name')
    
    if is_user is not None and is_user != person.is_user:
        person.is_user = is_user
        updated_fields.append('is_user')
    
    if updated_fields:
        person.save()
        record_person_update(person, updated_fields)
    
    return person

def change_person_department(person, department):
    """
    Change a person's department
    
    Args:
        person: Person object
        department: Department object
    
    Returns:
        Person: The updated person
    """
    old_department_id = person.department.id if person.department else None
    new_department_id = department.id if department else None
    
    if old_department_id != new_department_id:
        person.department = department
        person.save()
        record_person_department_change(person, old_department_id, new_department_id)
    
    return person

def add_person_to_team(person, team):
    """
    Add a person to a team
    
    Args:
        person: Person object
        team: Team object
    
    Returns:
        bool: True if added, False if already a member
    """
    if team not in person.teams.all():
        person.teams.add(team)
        record_person_team_change(person, None, team.id)
        return True
    return False

def remove_person_from_team(person, team):
    """
    Remove a person from a team
    
    Args:
        person: Person object
        team: Team object
    
    Returns:
        bool: True if removed, False if not a member
    """
    if team in person.teams.all():
        person.teams.remove(team)
        record_person_team_change(person, team.id, None)
        return True
    return False

def delete_person(person):
    """
    Delete a person
    
    Args:
        person: Person object
    """
    # Check for outputs assigned to this person
    outputs_count = Output.objects.filter(responsible=person).count()
    if outputs_count > 0:
        raise ValueError(f"Cannot delete person. They are responsible for {outputs_count} outputs.")
    
    record_person_deletion(person)
    
    # Remove from all teams
    for team in person.teams.all():
        person.teams.remove(team)
    
    person.delete()

def get_person_assignments(person_id):
    """
    Get all outputs assigned to a person
    
    Args:
        person_id (int): Person ID
    
    Returns:
        QuerySet: Outputs assigned to the person
    """
    return Output.objects.filter(responsible_id=person_id)
