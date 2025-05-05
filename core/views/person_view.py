from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction
from core.models import Person, Team, Department, Contact
from core.serializers.person_serializer import PersonSerializer
from core.services.history.person import (
    record_person_creation, 
    record_person_update, 
    record_person_team_change, 
    record_person_department_change,
    record_person_deletion
)
from core.services.history.contact import record_contact_creation

class PersonViewSet(viewsets.ModelViewSet):
    queryset = Person.objects.all()
    serializer_class = PersonSerializer
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        # Extract person data
        first_name = request.data.get('first_name')
        last_name = request.data.get('last_name')
        team_ids = request.data.get('team_ids', [])
        department_id = request.data.get('department_id')
        is_user = request.data.get('is_user', False)
        contact_data = request.data.get('contact', {})
        
        # Validate required fields
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
                is_user=is_user,
                department_id=department_id
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
                contact=Contact.objects.create(
                    id=person.contact_id,
                    address=contact_data.get('address', ''),
                    email=contact_data.get('email', ''),
                    phone=contact_data.get('phone', ''),
                    type='person'
                )
            
            # Record in history
            record_person_creation(person)
            record_contact_creation(contact)
            
            serializer = self.get_serializer(person)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @transaction.atomic
    def update(self, request, *args, **kwargs):
        person = self.get_object()
        
        # Extract person data
        first_name = request.data.get('first_name', person.first_name)
        last_name = request.data.get('last_name', person.last_name)
        is_user = request.data.get('is_user', person.is_user)
        
        # Track updated fields
        updated_fields = []
        if first_name != person.first_name:
            person.first_name = first_name
            updated_fields.append('first_name')
        
        if last_name != person.last_name:
            person.last_name = last_name
            updated_fields.append('last_name')
        
        if is_user != person.is_user:
            person.is_user = is_user
            updated_fields.append('is_user')
        
        # Handle department change
        if 'department_id' in request.data:
            department_id = request.data.get('department_id')
            old_department_id = person.department.id if person.department else None
            
            if department_id != old_department_id:
                if department_id:
                    try:
                        department = Department.objects.get(id=department_id)
                        person.department = department
                        updated_fields.append('department')
                        record_person_department_change(person, old_department_id, department_id)
                    except Department.DoesNotExist:
                        pass
                else:
                    person.department = None
                    updated_fields.append('department')
                    record_person_department_change(person, old_department_id, None)
        
        # Save person if fields were updated
        if updated_fields:
            person.save()
            record_person_update(person, updated_fields)
        
        # Handle teams if provided
        if 'team_ids' in request.data:
            team_ids = request.data.get('team_ids', [])
            current_teams = set(person.teams.values_list('id', flat=True))
            new_teams = set(int(t) for t in team_ids)
            
            # Record team changes
            for team_id in new_teams - current_teams:
                record_person_team_change(person, None, team_id)
            
            for team_id in current_teams - new_teams:
                record_person_team_change(person, team_id, None)
            
            # Update teams
            person.teams.set(Team.objects.filter(id__in=team_ids))
        
        serializer = self.get_serializer(person)
        return Response(serializer.data)
    
    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        person = self.get_object()
        
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
    
    @action(detail=True, methods=['post'])
    def add_to_team(self, request, pk=None):
        person = self.get_object()
        team_id = request.data.get('team_id')
        
        if not team_id:
            return Response(
                {"error": "Missing required field: team_id"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            team = Team.objects.get(id=team_id)
            if team not in person.teams.all():
                person.teams.add(team)
                record_person_team_change(person, None, team_id)
                return Response({"status": "Added to team successfully"})
            else:
                return Response(
                    {"error": f"Person is already a member of team with ID {team_id}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Team.DoesNotExist:
            return Response(
                {"error": f"Team with ID {team_id} not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def remove_from_team(self, request, pk=None):
        person = self.get_object()
        team_id = request.data.get('team_id')
        
        if not team_id:
            return Response(
                {"error": "Missing required field: team_id"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            team = Team.objects.get(id=team_id)
            if team in person.teams.all():
                person.teams.remove(team)
                record_person_team_change(person, team_id, None)
                return Response({"status": "Removed from team successfully"})
            else:
                return Response(
                    {"error": f"Person is not a member of team with ID {team_id}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Team.DoesNotExist:
            return Response(
                {"error": f"Team with ID {team_id} not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
