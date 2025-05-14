from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction
from core.models import Team, Person, Department, User, Contact, Authorization
from core.serializers.team_serializer import TeamSerializer
from core.serializers.person_serializer import PersonSerializer
from core.services.team.api import (
    initialize_team,
    update_team,
    delete_team,
    add_team_member,
    remove_team_member,
    get_team_members,
    get_team_projects
)
from core.services.history.person import record_person_creation
from core.services.history.contact import record_contact_creation
from core.services.history.user import record_user_creation

class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        # Extract team data
        name = request.data.get('name')
        description = request.data.get('description', '')
        department_id = request.data.get('department_id')
        is_user_team = request.data.get('is_user_team', False)
        members_data = request.data.get('members', [])
        
        # Validate required fields
        if not name:
            return Response(
                {"error": "Missing required field: name"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Get department if provided
            department = None
            if department_id:
                try:
                    department = Department.objects.get(id=department_id)
                except Department.DoesNotExist:
                    return Response(
                        {"error": f"Department with ID {department_id} not found"},
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            # Create team
            team = initialize_team(
                name=name,
                description=description,
                department=department,
                is_user_team=is_user_team
            )
            
            # Process members data to create or assign members
            for member_data in members_data:
                person = None
                # Option 1: Use existing person/user by ID
                if 'id' in member_data and member_data['id']:
                    try:
                        person = Person.objects.get(id=member_data['id'])
                        # If we're adding to a user team but person isn't a user yet,
                        # we'll just add them without converting (expecting this to be handled elsewhere)
                    except Person.DoesNotExist:
                        continue
                # Option 2: Create new person/user
                else:
                    # Extract common person fields
                    first_name = member_data.get('first_name')
                    last_name = member_data.get('last_name')
                    role = member_data.get('role')
                    member_department_id = member_data.get('department_id', department_id)
                    
                    # Skip if required fields are missing
                    if not (first_name and last_name):
                        continue
                    
                    # Extract contact information
                    contact_data = member_data.get('contact', {})
                    email = contact_data.get('email', '')
                    phone = contact_data.get('phone', '')
                    address = contact_data.get('address', '')
                    
                    # For user teams, check if we should create a user
                    if is_user_team and member_data.get('create_user', False):
                        # Extract user-specific fields
                        username = member_data.get('username')
                        password = member_data.get('password')
                        authorization_id = member_data.get('authorization_id')
                        is_active = member_data.get('is_active', True)
                        is_staff = member_data.get('is_staff', False)
                        is_superuser = member_data.get('is_superuser', False)
                        
                        if not all([username, password, authorization_id]):
                            # Skip user creation if missing required fields
                            continue
                        
                        # Create Person object first
                        person = Person.objects.create(
                            first_name=first_name,
                            last_name=last_name,
                            department_id=member_department_id,
                            role=role,
                            is_user=True  # Mark as user
                        )
                        
                        # Create Contact
                        contact = Contact.objects.create(
                            id=person.contact_id,
                            email=email,
                            phone=phone,
                            address=address,
                            type='user'
                        )
                        
                        # Create User
                        try:
                            authorization = Authorization.objects.get(id=authorization_id)
                            user = User.objects.create_user(
                                username=username,
                                password=password,
                                person=person,
                                authorization=authorization,
                                is_active=is_active,
                                is_staff=is_staff,
                                is_superuser=is_superuser
                            )
                            # Record history
                            record_user_creation(user)
                        except (Authorization.DoesNotExist, Exception) as e:
                            # If user creation fails, still keep the person
                            person.is_user = False
                            person.save()
                            # Continue to add as team member
                    else:
                        # Create regular person (for both user teams and client teams)
                        person = Person.objects.create(
                            first_name=first_name,
                            last_name=last_name,
                            department_id=member_department_id,
                            role=role,
                            is_user=False
                        )
                        
                        # Record in history
                        record_person_creation(person)
                        
                        # Create Contact
                        contact = Contact.objects.create(
                            id=person.contact_id,
                            email=email,
                            phone=phone,
                            address=address,
                            type='person'
                        )
                        
                        # Record in history
                        record_contact_creation(contact)
                
                if person:
                    # Add person to the team with optional member_type
                    member_type = member_data.get('member_type')
                    add_team_member(team, person, member_type)
            
            # Get the updated team with all its members
            serializer = self.get_serializer(team)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @transaction.atomic
    def update(self, request, *args, **kwargs):
        team = self.get_object()
        
        # Extract team data
        name = request.data.get('name')
        description = request.data.get('description')
        department_id = request.data.get('department_id')
        is_user_team = request.data.get('is_user_team', team.is_user_team)
        members_data = request.data.get('members')
        replace_members = request.data.get('replace_all_members', False)
        
        try:
            # Get department if provided
            department = None
            if department_id:
                try:
                    department = Department.objects.get(id=department_id)
                except Department.DoesNotExist:
                    return Response(
                        {"error": f"Department with ID {department_id} not found"},
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            # Update team
            updated_team = update_team(
                team=team,
                name=name,
                description=description,
                department=department
            )
            
            # Update is_user_team flag if provided
            if is_user_team != team.is_user_team:
                team.is_user_team = is_user_team
                team.save(update_fields=['is_user_team'])
            
            # Process members if provided
            if members_data is not None:
                if replace_members:
                    # Remove all existing members
                    current_members = list(team.members.all())
                    for person in current_members:
                        remove_team_member(team, person)
                
                # Process members data just like in create
                for member_data in members_data:
                    person = None
                    # Option 1: Use existing person/user by ID
                    if 'id' in member_data and member_data['id']:
                        try:
                            person = Person.objects.get(id=member_data['id'])
                        except Person.DoesNotExist:
                            continue
                    # Option 2: Create new person/user
                    else:
                        # Extract common person fields
                        first_name = member_data.get('first_name')
                        last_name = member_data.get('last_name')
                        role = member_data.get('role')
                        member_department_id = member_data.get('department_id', department_id)
                        
                        # Skip if required fields are missing
                        if not (first_name and last_name):
                            continue
                        
                        # Extract contact information
                        contact_data = member_data.get('contact', {})
                        email = contact_data.get('email', '')
                        phone = contact_data.get('phone', '')
                        address = contact_data.get('address', '')
                        
                        # For user teams, check if we should create a user
                        if is_user_team and member_data.get('create_user', False):
                            # Extract user-specific fields
                            username = member_data.get('username')
                            password = member_data.get('password')
                            authorization_id = member_data.get('authorization_id')
                            is_active = member_data.get('is_active', True)
                            is_staff = member_data.get('is_staff', False)
                            is_superuser = member_data.get('is_superuser', False)
                            
                            if not all([username, password, authorization_id]):
                                # Skip user creation if missing required fields
                                continue
                            
                            # Create Person object first
                            person = Person.objects.create(
                                first_name=first_name,
                                last_name=last_name,
                                department_id=member_department_id,
                                role=role,
                                is_user=True  # Mark as user
                            )
                            
                            # Create Contact
                            contact = Contact.objects.create(
                                id=person.contact_id,
                                email=email,
                                phone=phone,
                                address=address,
                                type='user'
                            )
                            
                            # Create User
                            try:
                                authorization = Authorization.objects.get(id=authorization_id)
                                user = User.objects.create_user(
                                    username=username,
                                    password=password,
                                    person=person,
                                    authorization=authorization,
                                    is_active=is_active,
                                    is_staff=is_staff,
                                    is_superuser=is_superuser
                                )
                                # Record history
                                record_user_creation(user)
                            except (Authorization.DoesNotExist, Exception) as e:
                                # If user creation fails, still keep the person
                                person.is_user = False
                                person.save()
                                # Continue to add as team member
                        else:
                            # Create regular person
                            person = Person.objects.create(
                                first_name=first_name,
                                last_name=last_name,
                                department_id=member_department_id,
                                role=role,
                                is_user=False
                            )
                            
                            # Record in history
                            record_person_creation(person)
                            
                            # Create Contact
                            contact = Contact.objects.create(
                                id=person.contact_id,
                                email=email,
                                phone=phone,
                                address=address,
                                type='person'
                            )
                            
                            # Record in history
                            record_contact_creation(contact)
                    
                    if person:
                        # Add person to the team with optional member_type
                        member_type = member_data.get('member_type')
                        add_team_member(team, person, member_type)
            
            # Get the updated team with all its members
            serializer = self.get_serializer(team)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
            
    # New endpoints for user and client teams
    @action(detail=False, methods=['get'])
    def user_teams(self, request):
        """Get all user teams"""
        teams = Team.objects.filter(is_user_team=True)
        serializer = self.get_serializer(teams, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def client_teams(self, request):
        """Get all client teams"""
        teams = Team.objects.filter(is_user_team=False)
        serializer = self.get_serializer(teams, many=True)
        return Response(serializer.data)
    
    # Keep existing actions with member_type support
    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        team = self.get_object()
        person_id = request.data.get('person_id')
        member_type = request.data.get('member_type')
        
        if not person_id:
            return Response(
                {"error": "Missing required field: person_id"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            person = Person.objects.get(id=person_id)
            
            # Check if the member type is appropriate for the team type
            if team.is_user_team and not person.is_user:
                # For user teams, suggest creating a user first
                return Response(
                    {"error": "This person is not a user. For user teams, members should have user accounts."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            add_team_member(team, person, member_type)
            return Response({"status": "Member added successfully"})
        except Person.DoesNotExist:
            return Response(
                {"error": f"Person with ID {person_id} not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        team = self.get_object()
        
        try:
            # Delete team
            delete_team(team)
            
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        try:
            members = get_team_members(pk)
            serializer = PersonSerializer(members, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def remove_member(self, request, pk=None):
        team = self.get_object()
        person_id = request.data.get('person_id')
        
        if not person_id:
            return Response(
                {"error": "Missing required field: person_id"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            person = Person.objects.get(id=person_id)
            remove_team_member(team, person)
            return Response({"status": "Member removed successfully"})
        except Person.DoesNotExist:
            return Response(
                {"error": f"Person with ID {person_id} not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
