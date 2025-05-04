from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction
from core.models import Department, Person, Team, User
from core.serializers.department_serializer import DepartmentSerializer
from core.serializers.person_serializer import PersonSerializer
from core.serializers.team_serializer import TeamSerializer
from core.services.department.api import (
    initialize_department,
    update_department,
    delete_department,
    get_department_members,
    get_department_teams
)
from core.services.history.department import record_department_creation, record_department_update, record_department_deletion

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        # Extract data
        name = request.data.get('name')
        responsible_id = request.data.get('responsible_id')
        
        if not name:
            return Response(
                {"error": "Name is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Create department
            department = Department(name=name)
            
            # Handle responsible assignment
            if responsible_id:
                try:
                    # Get the Person first
                    person = Person.objects.get(id=responsible_id)
                    
                    # Check if this Person is associated with a User
                    if person.is_user:
                        # Get the associated User
                        try:
                            user = User.objects.get(person_id=person.id)
                            department.responsible = user
                        except User.DoesNotExist:
                            return Response(
                                {"error": f"Person with ID {responsible_id} is marked as a user but no User record exists"},
                                status=status.HTTP_400_BAD_REQUEST
                            )
                    else:
                        return Response(
                            {"error": f"Person with ID {responsible_id} is not a user and cannot be assigned as responsible"},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                except Person.DoesNotExist:
                    return Response(
                        {"error": f"Person with ID {responsible_id} not found"},
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            # Save the department
            department.save()
            
            # Record creation in history
            record_department_creation(department)
            
            serializer = self.get_serializer(department)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @transaction.atomic
    def update(self, request, *args, **kwargs):
        department = self.get_object()
        
        # Extract department data
        name = request.data.get('name')
        responsible_id = request.data.get('responsible_id')
        
        try:
            # Get responsible user if provided
            responsible = None
            if responsible_id:
                try:
                    responsible = Person.objects.get(id=responsible_id, is_user=True)
                except Person.DoesNotExist:
                    return Response(
                        {"error": f"User with ID {responsible_id} not found"},
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            # Update department
            updated_department = update_department(
                department=department,
                name=name,
                responsible=responsible
            )
            
            # Record in history
            record_department_update(department)
            
            serializer = self.get_serializer(updated_department)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        department = self.get_object()
        
        try:
            # Delete department
            delete_department(department)
            
            # Record in history
            record_department_deletion(department)
            
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
            members = get_department_members(pk)
            serializer = PersonSerializer(members, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['get'])
    def teams(self, request, pk=None):
        try:
            teams = get_department_teams(pk)
            serializer = TeamSerializer(teams, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
