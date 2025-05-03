from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction
from core.models import Department, Person, Team
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
        # Extract department data
        name = request.data.get('name')
        responsible_id = request.data.get('responsible_id')
        
        # Validate required fields
        if not name:
            return Response(
                {"error": "Missing required field: name"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
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
            
            # Create department
            department = initialize_department(
                name=name,
                responsible=responsible
            )
            
            # Record in history
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
