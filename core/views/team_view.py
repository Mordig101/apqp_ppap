from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction
from core.models import Team, Person, Department
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

class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        # Extract team data
        name = request.data.get('name')
        description = request.data.get('description', '')
        department_id = request.data.get('department_id')
        members = request.data.get('members', [])
        
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
                department=department
            )
            
            # Add members if provided
            if members:
                persons = Person.objects.filter(id__in=members)
                for person in persons:
                    add_team_member(team, person)
            
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
            
            serializer = self.get_serializer(updated_team)
            return Response(serializer.data)
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
    def add_member(self, request, pk=None):
        team = self.get_object()
        person_id = request.data.get('person_id')
        
        if not person_id:
            return Response(
                {"error": "Missing required field: person_id"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            person = Person.objects.get(id=person_id)
            add_team_member(team, person)
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
