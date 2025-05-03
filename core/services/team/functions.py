from core.models import Team, Person, Project
from core.services.history.team import (
    record_team_creation,
    record_team_update,
    record_team_member_addition,
    record_team_member_removal,
    record_team_deletion
)

def get_team_by_id(team_id):
    """
    Get team by ID
    
    Args:
        team_id (int): Team ID
    
    Returns:
        Team: The team object
    """
    return Team.objects.get(id=team_id)

def get_teams_by_department(department_id):
    """
    Get teams that have members from a specific department
    
    Args:
        department_id (int): Department ID
    
    Returns:
        list: Teams with members from the specified department
    """
    # Get persons in the department
    persons = Person.objects.filter(department_id=department_id)
    
    # Get unique teams these persons belong to
    teams = set()
    for person in persons:
        for team in person.teams.all():
            teams.add(team)
    
    return list(teams)

def get_teams_by_project(project_id):
    """
    Get teams associated with a project
    
    Args:
        project_id (int): Project ID
    
    Returns:
        QuerySet: Teams associated with the project
    """
    try:
        project = Project.objects.get(id=project_id)
        return project.teams.all()
    except Project.DoesNotExist:
        return Team.objects.none()

def update_team(team, name=None, description=None):
    """
    Update team information
    
    Args:
        team: Team object
        name (str): New name (if None, keep existing)
        description (str): New description (if None, keep existing)
    
    Returns:
        Team: The updated team
    """
    updated_fields = []
    
    if name is not None and name != team.name:
        team.name = name
        updated_fields.append('name')
    
    if description is not None and description != team.description:
        team.description = description
        updated_fields.append('description')
    
    if updated_fields:
        team.save()
        record_team_update(team, updated_fields)
    
    return team

def add_team_member(team, person):
    """
    Add a person to a team
    
    Args:
        team: Team object
        person: Person object
    
    Returns:
        bool: True if added, False if already a member
    """
    if team not in person.teams.all():
        person.teams.add(team)
        record_team_member_addition(team, person.id)
        return True
    return False

def remove_team_member(team, person):
    """
    Remove a person from a team
    
    Args:
        team: Team object
        person: Person object
    
    Returns:
        bool: True if removed, False if not a member
    """
    if team in person.teams.all():
        person.teams.remove(team)
        record_team_member_removal(team, person.id)
        return True
    return False

def delete_team(team):
    """
    Delete a team
    
    Args:
        team: Team object
    """
    # Check for projects using this team
    projects_count = Project.objects.filter(teams=team).count()
    if projects_count > 0:
        raise ValueError(f"Cannot delete team. It is associated with {projects_count} projects.")
    
    # Remove team from all persons
    for person in team.members.all():
        person.teams.remove(team)
    
    record_team_deletion(team)
    team.delete()

def get_team_members(team_id):
    """
    Get all members of a team
    
    Args:
        team_id (int): Team ID
    
    Returns:
        QuerySet: Persons in the team
    """
    team = Team.objects.get(id=team_id)
    return team.members.all()

def get_team_projects(team_id):
    """
    Get all projects associated with a team
    
    Args:
        team_id (int): Team ID
    
    Returns:
        QuerySet: Projects associated with the team
    """
    team = Team.objects.get(id=team_id)
    return Project.objects.filter(teams=team)

def check_team_dependencies(team_id):
    """
    Check if a team has dependencies that would prevent deletion
    
    Args:
        team_id (int): Team ID
        
    Returns:
        dict: Dictionary of dependencies
    """
    try:
        team = Team.objects.get(id=team_id)
        projects = Project.objects.filter(teams=team)
        
        dependencies = {
            'projects': [{'id': p.id, 'name': p.name} for p in projects],
            'members_count': team.members.count()
        }
        
        return dependencies
    except Team.DoesNotExist:
        return {'error': 'Team not found'}
