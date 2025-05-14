from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction
from core.models import Client, Contact, Project, Team , Person
from core.serializers.client_serializer import ClientSerializer
from core.serializers.project_serializer import ProjectSerializer
from core.services.client.api import (
    initialize_client,
    update_client,
    delete_client,
    get_client_projects
)
from core.services.history.client import record_client_creation, record_client_update, record_client_deletion

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    pagination_class = None  # Add this line to disable pagination
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        # Extract client data
        name = request.data.get('name')
        address = request.data.get('address', '')
        code = request.data.get('code', {})
        description = request.data.get('description', '')
        contact_data = request.data.get('contact', {})
        
        # Extract team data
        team_data = request.data.get('team', {})
        team_id = request.data.get('team_id')  # For existing team
        
        # Extract team members data
        team_members = request.data.get('team_members', [])
        
        # Validate required fields
        if not name:
            return Response(
                {"error": "Missing required field: name"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Create client in a single save operation to avoid ID conflicts
            client = Client()
            client.name = name
            client.address = address
            client.code = code
            client.description = description
            client.save()
            
            # Create contact for client
            Contact.objects.create(
                id=client.contact_id,
                address=contact_data.get('address', '') or address,
                email=contact_data.get('email', ''),
                phone=contact_data.get('phone', ''),
                type='client'
            )
            
            # Handle team association - either create new team or use existing
            if team_data and team_data.get('name'):
                # Create new team
                team = Team()
                team.name = team_data.get('name')
                team.description = team_data.get('description', '')
                team.save()
                
                client.team = team
                client.save(update_fields=['team'])
            elif team_id:
                # Use existing team
                try:
                    team = Team.objects.get(id=team_id)
                    client.team = team
                    client.save(update_fields=['team'])
                except Team.DoesNotExist:
                    return Response(
                        {"error": f"Team with ID {team_id} not found"},
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            # Create team members (persons) if provided
            if team_members and client.team:
                for member_data in team_members:
                    # Create person
                    person = Person()
                    person.first_name = member_data.get('first_name', '')
                    person.last_name = member_data.get('last_name', '')
                    person.role = member_data.get('role', '')
                    person.save()
                    
                    # Add person to team
                    person.teams.add(client.team)
                    
                    # Create contact for person if provided
                    person_contact_data = member_data.get('contact', {})
                    if person_contact_data:
                        Contact.objects.create(
                            id=person.contact_id,
                            email=person_contact_data.get('email', ''),
                            phone=person_contact_data.get('phone', ''),
                            address=person_contact_data.get('address', ''),
                            type='person'
                        )
            
            # Record in history
            record_client_creation(client)
            
            # Return the client data with team and team members
            serializer = self.get_serializer(client)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @transaction.atomic
    def update(self, request, *args, **kwargs):
        client = self.get_object()
        
        # Extract client data
        name = request.data.get('name')
        address = request.data.get('address')
        code = request.data.get('code')
        description = request.data.get('description')
        contact_data = request.data.get('contact', {})
        
        # Extract team data
        team_data = request.data.get('team', {})
        team_id = request.data.get('team_id')
        
        # Extract team members data
        team_members = request.data.get('team_members', [])
        
        try:
            # Update basic client fields
            if name is not None:
                client.name = name
            if address is not None:
                client.address = address
            if code is not None:
                client.code = code
            if description is not None:
                client.description = description
            client.save()
            
            # Update client's contact if provided
            if contact_data and client.contact_id:
                try:
                    contact = Contact.objects.get(id=client.contact_id)
                    
                    # Update contact fields if provided
                    if 'email' in contact_data:
                        contact.email = contact_data['email']
                    if 'phone' in contact_data:
                        contact.phone = contact_data['phone']
                    if 'address' in contact_data:
                        contact.address = contact_data['address']
                    
                    contact.save()
                except Contact.DoesNotExist:
                    # Create a new contact if it doesn't exist
                    Contact.objects.create(
                        id=client.contact_id,
                        email=contact_data.get('email', ''),
                        phone=contact_data.get('phone', ''),
                        address=contact_data.get('address', '') or client.address,
                        type='client'
                    )
            
            # Handle team association - either update existing, create new, or clear
            current_team = client.team
            
            # Case 1: Set to a specific existing team
            if team_id and not team_data:
                try:
                    team = Team.objects.get(id=team_id)
                    client.team = team
                    client.save(update_fields=['team'])
                except Team.DoesNotExist:
                    return Response(
                        {"error": f"Team with ID {team_id} not found"},
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            # Case 2: Create a new team or update existing team
            elif team_data and team_data.get('name'):
                # Update existing team
                if current_team:
                    if 'name' in team_data:
                        current_team.name = team_data['name']
                    if 'description' in team_data:
                        current_team.description = team_data.get('description', '')
                    current_team.save()
                # Create new team
                else:
                    team = Team()
                    team.name = team_data.get('name')
                    team.description = team_data.get('description', '')
                    team.save()
                    client.team = team
                    client.save(update_fields=['team'])
            
            # Case 3: Clear team association
            elif team_id is None and not team_data:
                client.team = None
                client.save(update_fields=['team'])
            
            # Update team members if client has a team
            if team_members and client.team:
                # Get current team members
                current_members = Person.objects.filter(teams=client.team)
                current_member_ids = {person.id for person in current_members if person.id}
                
                # Also create a dictionary mapping (first_name, last_name) to person objects
                member_name_map = {
                    (person.first_name.lower(), person.last_name.lower()): person 
                    for person in current_members
                }
                
                # Track which members we've processed
                processed_member_ids = set()
                
                # Process each member in the request
                for member_data in team_members:
                    member_id = member_data.get('id')
                    first_name = member_data.get('first_name', '')
                    last_name = member_data.get('last_name', '')
                    
                    # Skip if name fields are empty
                    if not first_name or not last_name:
                        continue
                    
                    # Case 1: ID is provided and member exists - Update by ID
                    if member_id and member_id in current_member_ids:
                        try:
                            person = Person.objects.get(id=member_id)
                            
                            # Update basic person fields if provided
                            person.first_name = first_name
                            person.last_name = last_name
                            if 'role' in member_data:
                                person.role = member_data['role']
                            
                            person.save()
                            
                            # Update contact for this person
                            person_contact_data = member_data.get('contact', {})
                            if person_contact_data and person.contact_id:
                                try:
                                    contact = Contact.objects.get(id=person.contact_id)
                                    
                                    if 'email' in person_contact_data:
                                        contact.email = person_contact_data['email']
                                    if 'phone' in person_contact_data:
                                        contact.phone = person_contact_data['phone']
                                    if 'address' in person_contact_data:
                                        contact.address = person_contact_data['address']
                                    
                                    contact.save()
                                except Contact.DoesNotExist:
                                    # Create contact if it doesn't exist
                                    Contact.objects.create(
                                        id=person.contact_id,
                                        email=person_contact_data.get('email', ''),
                                        phone=person_contact_data.get('phone', ''),
                                        address=person_contact_data.get('address', ''),
                                        type='person'
                                    )
                            
                            processed_member_ids.add(member_id)
                            
                        except Person.DoesNotExist:
                            # If ID was provided but not found, skip
                            continue
                            
                    # Case 2: No ID but name matches existing member - Update by name
                    elif not member_id and (first_name.lower(), last_name.lower()) in member_name_map:
                        person = member_name_map[(first_name.lower(), last_name.lower())]
                        
                        # Update role if provided
                        if 'role' in member_data:
                            person.role = member_data['role']
                            
                        person.save()
                        
                        # Update contact for this person
                        person_contact_data = member_data.get('contact', {})
                        if person_contact_data and person.contact_id:
                            try:
                                contact = Contact.objects.get(id=person.contact_id)
                                
                                if 'email' in person_contact_data:
                                    contact.email = person_contact_data['email']
                                if 'phone' in person_contact_data:
                                    contact.phone = person_contact_data['phone']
                                if 'address' in person_contact_data:
                                    contact.address = person_contact_data['address']
                                
                                contact.save()
                            except Contact.DoesNotExist:
                                # Create contact if it doesn't exist
                                Contact.objects.create(
                                    id=person.contact_id,
                                    email=person_contact_data.get('email', ''),
                                    phone=person_contact_data.get('phone', ''),
                                    address=person_contact_data.get('address', ''),
                                    type='person'
                                )
                        
                        processed_member_ids.add(person.id)
                        
                    # Case 3: New team member - Create new
                    else:
                        # Create person
                        person = Person()
                        person.first_name = first_name
                        person.last_name = last_name
                        person.role = member_data.get('role', '')
                        person.save()
                        
                        # Add to team
                        person.teams.add(client.team)
                        
                        # Create contact for person if provided
                        person_contact_data = member_data.get('contact', {})
                        if person_contact_data:
                            Contact.objects.create(
                                id=person.contact_id,
                                email=person_contact_data.get('email', ''),
                                phone=person_contact_data.get('phone', ''),
                                address=person_contact_data.get('address', ''),
                                type='person'
                            )
                        
                        if person.id:
                            processed_member_ids.add(person.id)
                
                # Handle member removal if the 'replace_all_members' flag is set
                if request.data.get('replace_all_members', False):
                    # Remove members that weren't in the request
                    members_to_remove = current_member_ids - processed_member_ids
                    for member_id in members_to_remove:
                        try:
                            person = Person.objects.get(id=member_id)
                            person.teams.remove(client.team)
                        except Person.DoesNotExist:
                            continue
            
            # To track which fields were updated:
            updated_fields = []
            if name is not None:
                updated_fields.append('name')
            if address is not None:
                updated_fields.append('address')
            if code is not None:
                updated_fields.append('code')
            if description is not None:
                updated_fields.append('description')
            if contact_data:
                updated_fields.append('contact')
            if team_data or team_id is not None:
                updated_fields.append('team')
            if team_members:
                updated_fields.append('team_members')

            # Now call with the tracked fields
            record_client_update(client, updated_fields)
            
            # Return the updated client data
            serializer = self.get_serializer(client)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        client = self.get_object()
        
        try:
            # Delete client
            delete_client(client)
            
            # Record in history
            record_client_deletion(client)
            
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
    def projects(self, request, pk=None):
        try:
            projects = get_client_projects(pk)
            serializer = ProjectSerializer(projects, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
