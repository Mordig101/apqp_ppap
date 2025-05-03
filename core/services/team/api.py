"""
Team API - Provides consistent interface to team functionality
"""
from rest_framework.response import Response
from rest_framework import status
from core.models import Team, Person, Department
from core.serializers.team_serializer import TeamSerializer
from core.services.team.functions import (
    get_team_by_id,
    get_teams_by_department,
    get_teams_by_project,
    update_team as update_team_func,
    add_team_member,
    remove_team_member,
    delete_team as delete_team_func,
    get_team_members as get_members_func,
    get_team_projects as get_projects_func,
    check_team_dependencies
)
from core.services.history.team import (
    record_team_creation,
    record_team_update,
    record_team_name_change,
    record_team_member_addition,
    record_team_member_removal,
    record_team_deletion
)

def initialize_team(name, description=None, department=None):
    """
    Initialize a new team
    
    Args:
        name (str): Team name
        description (str, optional): Team description
        department (Department, optional): Associated department
        
    Returns:
        Team: The created team
    """
    # Create new team
    team = Team.objects.create(
        name=name,
        description=description
    )
    
    # Record in history
    record_team_creation(team)
    
    # Associate with department if provided
    if department:
        # Handle department relation if needed
        pass
        
    return team

def update_team(team, name=None, description=None, department=None):
    """
    Update team information
    
    Args:
        team: Team object
        name (str, optional): New team name
        description (str, optional): New team description
        department (Department, optional): New department association
        
    Returns:
        Team: The updated team
    """
    return update_team_func(team, name, description)

def delete_team(team):
    """
    Delete a team
    
    Args:
        team: Team object
    """
    return delete_team_func(team)

# Export all functions for use in views
__all__ = [
    # Initialization
    'initialize_team',
    
    # Functions
    'get_team_by_id',
    'get_teams_by_department',
    'get_teams_by_project',
    'update_team',
    'add_team_member',
    'remove_team_member',
    'delete_team',
    'get_team_members',
    'get_team_projects',
    
    # API endpoints
    'api_create_team',
    'api_update_team',
    'api_delete_team',
    'api_get_team',
    'api_list_teams',
    'api_add_team_member',
    'api_remove_team_member'
]

def get_team_members(team_id):
    """
    Get all members of a team - wrapper for the function
    """
    return get_members_func(team_id)

def get_team_projects(team_id):
    """
    Get all projects associated with a team - wrapper for the function
    """
    return get_projects_func(team_id)

def api_create_team(request):
    """
    API endpoint to create a team
    
    Args:
        request: HTTP request with team data
        
    Returns:
        Response: HTTP response
    """
    name = request.data.get('name')
    description = request.data.get('description', '')
    members = request.data.get('members', [])
    
    if not name:
        return Response(
            {"error": "Missing required field: name"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Create team
        team = initialize_team(name=name, description=description)
        
        # Add members if provided
        if members:
            for member_id in members:
                try:
                    person = Person.objects.get(id=member_id)
                    add_team_member(team, person)
                except Person.DoesNotExist:
                    pass
        
        serializer = TeamSerializer(team)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )

def api_update_team(request, team_id):
    """
    API endpoint to update a team
    
    Args:
        request: HTTP request with team data
        team_id (int): Team ID
        
    Returns:
        Response: HTTP response
    """
    try:
        team = Team.objects.get(id=team_id)
    except Team.DoesNotExist:
        return Response(
            {"error": f"Team with ID {team_id} not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    name = request.data.get('name', team.name)
    description = request.data.get('description', team.description)
    members = request.data.get('members', None)
    
    # Update team
    updated_team = update_team(team, name, description)
    
    # Update members if provided
    if members is not None:
        current_members = set(team.members.values_list('id', flat=True))
        new_members = set(int(m) for m in members)
        
        # Add new members
        for member_id in new_members - current_members:
            try:
                person = Person.objects.get(id=member_id)
                add_team_member(team, person)
            except Person.DoesNotExist:
                pass
        
        # Remove members
        for member_id in current_members - new_members:
            try:
                person = Person.objects.get(id=member_id)
                remove_team_member(team, person)
            except Person.DoesNotExist:
                pass
    
    serializer = TeamSerializer(team)
    return Response(serializer.data)

def api_delete_team(request, team_id):
    """
    API endpoint to delete a team
    
    Args:
        request: HTTP request
        team_id (int): Team ID
        
    Returns:
        Response: HTTP response
    """
    try:
        team = Team.objects.get(id=team_id)
    except Team.DoesNotExist:
        return Response(
            {"error": f"Team with ID {team_id} not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check dependencies
    dependencies = check_team_dependencies(team_id)
    
    try:
        # Delete the team
        delete_team(team)
        return Response(status=status.HTTP_204_NO_CONTENT)
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )

def api_get_team(request, team_id):
    """
    API endpoint to get a team
    
    Args:
        request: HTTP request
        team_id (int): Team ID
        
    Returns:
        Response: HTTP response
    """
    try:
        team = Team.objects.get(id=team_id)
        serializer = TeamSerializer(team)
        return Response(serializer.data)
    except Team.DoesNotExist:
        return Response(
            {"error": f"Team with ID {team_id} not found"},
            status=status.HTTP_404_NOT_FOUND
        )

def api_list_teams(request):
    """
    API endpoint to list all teams
    
    Args:
        request: HTTP request
        
    Returns:
        Response: HTTP response
    """
    teams = Team.objects.all()
    
    # Apply filters if provided
    name_filter = request.query_params.get('name', None)
    if name_filter:
        teams = teams.filter(name__icontains=name_filter)
    
    serializer = TeamSerializer(teams, many=True)
    return Response(serializer.data)

def api_add_team_member(request, team_id):
    """
    API endpoint to add a member to a team
    
    Args:
        request: HTTP request
        team_id (int): Team ID
        
    Returns:
        Response: HTTP response
    """
    person_id = request.data.get('person_id')
    
    if not person_id:
        return Response(
            {"error": "Missing required field: person_id"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        team = Team.objects.get(id=team_id)
        person = Person.objects.get(id=person_id)
        success = add_team_member(team, person)
        
        if success:
            return Response({"status": "Member added successfully"})
        else:
            return Response(
                {"error": "Person is already a member of this team"},
                status=status.HTTP_400_BAD_REQUEST
            )
    except Team.DoesNotExist:
        return Response(
            {"error": f"Team with ID {team_id} not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Person.DoesNotExist:
        return Response(
            {"error": f"Person with ID {person_id} not found"},
            status=status.HTTP_404_NOT_FOUND
        )

def api_remove_team_member(request, team_id):
    """
    API endpoint to remove a member from a team
    
    Args:
        request: HTTP request
        team_id (int): Team ID
        
    Returns:
        Response: HTTP response
    """
    person_id = request.data.get('person_id')
    
    if not person_id:
        return Response(
            {"error": "Missing required field: person_id"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        team = Team.objects.get(id=team_id)
        person = Person.objects.get(id=person_id)
        success = remove_team_member(team, person)
        
        if success:
            return Response({"status": "Member removed successfully"})
        else:
            return Response(
                {"error": "Person is not a member of this team"},
                status=status.HTTP_400_BAD_REQUEST
            )
    except Team.DoesNotExist:
        return Response(
            {"error": f"Team with ID {team_id} not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Person.DoesNotExist:
        return Response(
            {"error": f"Person with ID {person_id} not found"},
            status=status.HTTP_404_NOT_FOUND
        )
