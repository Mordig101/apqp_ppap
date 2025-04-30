from rest_framework import viewsets, status, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction
from django.db.models import Count, Q
from core.models import Team, Person, TeamMemberRole, Department
from core.serializers.team_serializer import TeamSerializer
from core.serializers.team_member_role_serializer import TeamMemberRoleSerializer
from core.services.history.initialization import initialize_history
from core.services.history.team import (
    record_team_update, 
    record_team_member_addition, 
    record_team_member_removal, 
    record_team_deletion,
    get_team_history
)
from core.services.history.team_role import record_team_role_assignment, record_team_role_change

class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        # Extract team data
        name = request.data.get('name')
        description = request.data.get('description', '')
        members = request.data.get('members', [])
        member_roles = request.data.get('member_roles', {})
        
        # Validate required fields
        if not name:
            return Response(
                {"error": "Missing required field: name"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Create team
            team = Team.objects.create(
                name=name,
                description=description
            )
            
            # Add members if provided
            if members:
                # Update the team field for each person
                Person.objects.filter(id__in=members).update(team=team)
                
                # Assign roles to members if provided
                for person_id in members:
                    # Get role for this person (if provided)
                    role = member_roles.get(str(person_id), 'Member')
                    
                    # Create role assignment
                    TeamMemberRole.objects.create(
                        person_id=person_id,
                        team=team,
                        role=role
                    )
            
            # Record in history
            initialize_history(
                title=name,
                event=f"Team created with ID {team.id}",
                table_name='team',
                history_id=team.history_id
            )
            
            serializer = self.get_serializer(team)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def assign_members(self, request, pk=None):
        """
        Assign members to a team with optional roles.
        """
        team = self.get_object()
        members = request.data.get('members', [])
        member_roles = request.data.get('member_roles', {})
        
        try:
            with transaction.atomic():
                # Update the team field for each person
                Person.objects.filter(id__in=members).update(team=team)
                
                # Assign roles to members
                for person_id in members:
                    # Get role for this person (if provided)
                    role = member_roles.get(str(person_id), 'Member')
                    
                    # Create or update role assignment
                    TeamMemberRole.objects.update_or_create(
                        person_id=person_id,
                        team=team,
                        defaults={'role': role}
                    )
                
                # Record in history
                initialize_history(
                    title=team.name,
                    event=f"Members assigned to team ID {team.id}",
                    table_name='team',
                    history_id=team.history_id
                )
            
            serializer = self.get_serializer(team)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def get_queryset(self):
        """
        Override the default queryset to allow filtering
        """
        queryset = Team.objects.all()
        
        # Filter by department if provided
        department_id = self.request.query_params.get('department_id', None)
        if department_id:
            # Check if department field exists in the model
            from django.db import connection
            cursor = connection.cursor()
            cursor.execute("PRAGMA table_info(team)")
            columns = [column[1] for column in cursor.fetchall()]
            if 'department_id' in columns:
                queryset = queryset.filter(department_id=department_id)
            
        # Filter by project involvement if provided
        project_id = self.request.query_params.get('project_id', None)
        if project_id:
            try:
                queryset = queryset.filter(projects__id=project_id)
            except:
                # Project relationship might not exist
                pass
            
        return queryset
    
    def retrieve(self, request, *args, **kwargs):
        """
        Get team details with member count, members, roles, and projects
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        
        # Get team data
        team_data = serializer.data
        
        # Add member count
        team_data['member_count'] = Person.objects.filter(team_roles__team=instance).count()
        
        # Get activity history
        team_data['history'] = get_team_history(instance.id)
        
        # Get project assignments (if Project model has a relationship to Team)
        try:
            team_data['projects'] = list(instance.projects.values('id', 'name'))
        except:
            team_data['projects'] = []
            
        return Response(team_data)
    
    def list(self, request, *args, **kwargs):
        """
        Get a list of teams with member counts
        """
        queryset = self.filter_queryset(self.get_queryset())
        
        # Add member counts using annotation
        queryset = queryset.annotate(member_count=Count('member_roles__person', distinct=True))
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            data = serializer.data
            # Add member counts to each team in the data
            for i, team in enumerate(page):
                data[i]['member_count'] = team.member_count
            return self.get_paginated_response(data)
            
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data
        # Add member counts to each team in the data
        for i, team in enumerate(queryset):
            data[i]['member_count'] = team.member_count
        return Response(data)
    
    @transaction.atomic
    def update(self, request, *args, **kwargs):
        """
        Update team information, including basic details and department associations
        """
        instance = self.get_object()
        updated_fields = []
        
        # Update basic information
        if 'name' in request.data and request.data['name'] != instance.name:
            instance.name = request.data['name']
            updated_fields.append('name')
            
        if 'description' in request.data and request.data['description'] != instance.description:
            instance.description = request.data['description']
            updated_fields.append('description')
        
        # Update department association if Department model has a relationship to Team
        if 'department_id' in request.data:
            try:
                department = Department.objects.get(id=request.data['department_id'])
                instance.department = department
                updated_fields.append('department')
            except Department.DoesNotExist:
                return Response(
                    {"error": f"Department with id {request.data['department_id']} does not exist"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            except Exception as e:
                # This will happen if the Team model doesn't have a department field
                pass
        
        if updated_fields:
            instance.save()
            # Record history for the update
            record_team_update(instance, updated_fields)
            
        # Handle membership management if provided
        self._handle_membership_updates(instance, request)
            
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    def partial_update(self, request, *args, **kwargs):
        """
        Same as update but for partial updates (PATCH)
        """
        return self.update(request, *args, **kwargs)
    
    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        """
        Delete team and handle related objects
        """
        instance = self.get_object()
        
        # Record history before deletion
        record_team_deletion(instance)
        
        # Perform the deletion
        instance.delete()
        
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    def _handle_membership_updates(self, team, request):
        """
        Helper method to handle membership updates
        """
        # Add new members
        if 'add_members' in request.data:
            new_members = request.data['add_members']
            
            for member_data in new_members:
                person_id = member_data.get('id')
                role = member_data.get('role', 'Member')
                
                try:
                    # Check if person exists
                    person = Person.objects.get(id=person_id)
                    
                    # Create team role if it doesn't exist
                    team_role, created = TeamMemberRole.objects.get_or_create(
                        person_id=person_id,
                        team=team,
                        defaults={'role': role}
                    )
                    
                    # Update role if the team role already exists
                    if not created and team_role.role != role:
                        team_role.role = role
                        team_role.save()
                        record_team_role_change(team, person_id, role)
                    elif created:
                        record_team_member_addition(team, person_id)
                        record_team_role_assignment(team, person_id, role)
                        
                except Person.DoesNotExist:
                    # Skip if person doesn't exist
                    continue
        
        # Remove members
        if 'remove_members' in request.data:
            member_ids = request.data['remove_members']
            
            for person_id in member_ids:
                try:
                    # Delete team role
                    TeamMemberRole.objects.filter(
                        person_id=person_id,
                        team=team
                    ).delete()
                    
                    record_team_member_removal(team, person_id)
                except:
                    # Skip if team role doesn't exist
                    continue
        
        # Update member roles
        if 'update_member_roles' in request.data:
            role_updates = request.data['update_member_roles']
            
            for update in role_updates:
                person_id = update.get('id')
                new_role = update.get('role')
                
                if person_id and new_role:
                    try:
                        team_role = TeamMemberRole.objects.get(
                            person_id=person_id,
                            team=team
                        )
                        
                        if team_role.role != new_role:
                            team_role.role = new_role
                            team_role.save()
                            record_team_role_change(team, person_id, new_role)
                            
                    except TeamMemberRole.DoesNotExist:
                        # Skip if team role doesn't exist
                        continue
