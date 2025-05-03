"""
Person API service
"""
from rest_framework.response import Response
from rest_framework import status
from core.models import Person, Team, Department, Contact
from core.serializers.person_serializer import PersonSerializer
from core.services.person.functions import (
    update_person,
    update_person_department,
    add_person_to_team,
    remove_person_from_team,
    check_person_dependencies
)
from core.services.history.person import (
    record_person_creation,
    record_person_deletion
)

# Person service API
from core.services.person.initialization import initialize_person
from core.services.person.functions import (
    get_person_by_id,
    get_persons_by_team,
    get_persons_by_department,
    get_users,
    update_person,
    change_person_department,
    add_person_to_team,
    remove_person_from_team,
    delete_person,
    get_person_assignments
)

# Export all functions for use in views
__all__ = [
    # Initialization
    'initialize_person',
    
    # Functions
    'get_person_by_id',
    'get_persons_by_team',
    'get_persons_by_department',
    'get_users',
    'update_person',
    'change_person_department',
    'add_person_to_team',
    'remove_person_from_team',
    'delete_person',
    'get_person_assignments'
]

def api_create_person(request):
    """
    API endpoint to create a person
    
    Args:
        request: HTTP request with person data
        
    Returns:
        Response: HTTP response
    """
    first_name = request.data.get('first_name')
    last_name = request.data.get('last_name')
    team_ids = request.data.get('team_ids', [])
    department_id = request.data.get('department_id')
    is_user = request.data.get('is_user', False)
    contact_data = request.data.get('contact', {})
    
    if not all([first_name, last_name]):
        return Response(
            {"error": "Missing required fields: first_name, last_name"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Create person
        person = Person.objects.create(
            first_name=first_name,
            last_name=last_name,
            is_user=is_user
        )
        
        # Add to teams if provided
        if team_ids:
            teams = Team.objects.filter(id__in=team_ids)
            person.teams.set(teams)
        
        # Set department if provided
        if department_id:
            try:
                department = Department.objects.get(id=department_id)
                person.department = department
                person.save()
            except Department.DoesNotExist:
                pass
        
        # Create contact
        if contact_data:
            Contact.objects.create(
                id=person.contact_id,
                address=contact_data.get('address', ''),
                email=contact_data.get('email', ''),
                phone=contact_data.get('phone', ''),
                type='person'
            )
        
        # Record in history
        record_person_creation(person)
        
        serializer = PersonSerializer(person)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )

def api_update_person(request, person_id):
    """
    API endpoint to update a person
    
    Args:
        request: HTTP request with person data
        person_id (int): Person ID
        
    Returns:
        Response: HTTP response
    """
    try:
        person = Person.objects.get(id=person_id)
    except Person.DoesNotExist:
        return Response(
            {"error": f"Person with ID {person_id} not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    first_name = request.data.get('first_name', person.first_name)
    last_name = request.data.get('last_name', person.last_name)
    is_user = request.data.get('is_user', person.is_user)
    
    # Update person
    updated_person = update_person(person_id, first_name, last_name, is_user)
    
    # Handle department change
    if 'department_id' in request.data:
        department_id = request.data.get('department_id')
        update_person_department(person_id, department_id)
    
    # Handle teams if provided
    if 'team_ids' in request.data:
        team_ids = request.data.get('team_ids', [])
        current_teams = set(person.teams.values_list('id', flat=True))
        new_teams = set(int(t) for t in team_ids)
        
        # Add new teams
        for team_id in new_teams - current_teams:
            add_person_to_team(person_id, team_id)
        
        # Remove teams
        for team_id in current_teams - new_teams:
            remove_person_from_team(person_id, team_id)
    
    serializer = PersonSerializer(person)
    return Response(serializer.data)

def api_delete_person(request, person_id):
    """
    API endpoint to delete a person
    
    Args:
        request: HTTP request
        person_id (int): Person ID
        
    Returns:
        Response: HTTP response
    """
    try:
        person = Person.objects.get(id=person_id)
    except Person.DoesNotExist:
        return Response(
            {"error": f"Person with ID {person_id} not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check dependencies
    dependencies = check_person_dependencies(person_id)
    
    # Record deletion in history
    record_person_deletion(person)
    
    # Delete associated contact if exists
    try:
        contact = Contact.objects.get(id=person.contact_id)
        contact.delete()
    except Contact.DoesNotExist:
        pass
    
    # Delete the person
    person.delete()
    
    return Response(status=status.HTTP_204_NO_CONTENT)

def api_get_person(request, person_id):
    """
    API endpoint to get a person
    
    Args:
        request: HTTP request
        person_id (int): Person ID
        
    Returns:
        Response: HTTP response
    """
    try:
        person = Person.objects.get(id=person_id)
        serializer = PersonSerializer(person)
        return Response(serializer.data)
    except Person.DoesNotExist:
        return Response(
            {"error": f"Person with ID {person_id} not found"},
            status=status.HTTP_404_NOT_FOUND
        )

def api_list_persons(request):
    """
    API endpoint to list all persons
    
    Args:
        request: HTTP request
        
    Returns:
        Response: HTTP response
    """
    persons = Person.objects.all()
    
    # Apply filters if provided
    name_filter = request.query_params.get('name', None)
    if name_filter:
        persons = persons.filter(
            first_name__icontains=name_filter
        ) | persons.filter(
            last_name__icontains=name_filter
        )
    
    team_filter = request.query_params.get('team_id', None)
    if team_filter:
        persons = persons.filter(teams__id=team_filter)
    
    department_filter = request.query_params.get('department_id', None)
    if department_filter:
        persons = persons.filter(department_id=department_filter)
    
    is_user_filter = request.query_params.get('is_user', None)
    if is_user_filter is not None:
        is_user_bool = is_user_filter.lower() == 'true'
        persons = persons.filter(is_user=is_user_bool)
    
    serializer = PersonSerializer(persons, many=True)
    return Response(serializer.data)

def api_add_person_to_team(request, person_id):
    """
    API endpoint to add a person to a team
    
    Args:
        request: HTTP request
        person_id (int): Person ID
        
    Returns:
        Response: HTTP response
    """
    team_id = request.data.get('team_id')
    
    if not team_id:
        return Response(
            {"error": "Missing required field: team_id"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    success = add_person_to_team(person_id, team_id)
    
    if success:
        return Response({"status": "Added to team successfully"})
    else:
        return Response(
            {"error": "Failed to add person to team"},
            status=status.HTTP_400_BAD_REQUEST
        )

def api_remove_person_from_team(request, person_id):
    """
    API endpoint to remove a person from a team
    
    Args:
        request: HTTP request
        person_id (int): Person ID
        
    Returns:
        Response: HTTP response
    """
    team_id = request.data.get('team_id')
    
    if not team_id:
        return Response(
            {"error": "Missing required field: team_id"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    success = remove_person_from_team(person_id, team_id)
    
    if success:
        return Response({"status": "Removed from team successfully"})
    else:
        return Response(
            {"error": "Failed to remove person from team"},
            status=status.HTTP_400_BAD_REQUEST
        )
