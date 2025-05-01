from rest_framework import viewsets, status, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction
from rest_framework.filters import OrderingFilter
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
from core.services.history.team_role import record_team_role_assignment, record_team_role_change, record_team_role_removal # Add missing import

class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    filter_backends = [filters.SearchFilter, OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name', 'id']
    ordering = ['name']  # default ordering
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        try:
            # First validate the incoming data using the serializer
            serializer = self.get_serializer(data=request.data)
            if not serializer.is_valid():
                return Response(
                    {"errors": serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Extract validated data
            validated_data = serializer.validated_data
            name = validated_data.get('name')
            description = validated_data.get('description', '')
            department = validated_data.get('department')
            members = request.data.get('members', [])
            member_roles = request.data.get('member_roles', {})
            
            # Create team with validated data
            team = Team.objects.create(
                name=name,
                description=description,
                department=department
            )
            
            # Handle member assignments
            for member_id in members:
                try:
                    person = Person.objects.get(pk=member_id)
                    team.members.add(person)
                    
                    # Add member role if specified
                    role_id = member_roles.get(str(member_id))
                    if role_id:
                        try:
                            role = TeamMemberRole.objects.create(
                                team=team,
                                person=person,
                                role_id=role_id
                            )
                            record_team_role_assignment(role)
                        except Exception as e:
                            return Response(
                                {"error": f"Failed to assign role to member {member_id}: {str(e)}"},
                                status=status.HTTP_400_BAD_REQUEST
                            )
                            
                    record_team_member_addition(team, person)
                except Person.DoesNotExist:
                    return Response(
                        {"error": f"Person with id {member_id} does not exist"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Return the created team
            serializer = self.get_serializer(team)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            # Rollback is automatic due to @transaction.atomic
            return Response(
                {"error": f"Failed to create team: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
            # Create team with validated data
            team = Team.objects.create(
                name=name,
                description=description,
                department=department
            )
        
        try:
            # Create team, including department if provided
            team = Team.objects.create(
                name=name,
                description=description,
                department_id=department_id # Pass department_id here
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
                    # Record role assignment history
                    record_team_role_assignment(team, person_id, role)
            
            # Record team creation in history
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
        Update team information, including basic details, department, and members.
        Handles both PUT and PATCH.
        """
        instance = self.get_object()
        updated_fields = []
        
        # Update basic information
        if 'name' in request.data and request.data['name'] != instance.name:
            updated_fields.append(f"Name changed from '{instance.name}' to '{request.data['name']}'")
            instance.name = request.data['name']
            
        if 'description' in request.data and request.data['description'] != instance.description:
            updated_fields.append("Description updated")
            instance.description = request.data['description']
        
        # Update department association
        if 'department_id' in request.data:
            new_department_id = request.data['department_id']
            if new_department_id != (instance.department.id if instance.department else None):
                try:
                    new_department = Department.objects.get(id=new_department_id) if new_department_id else None
                    old_department_name = instance.department.name if instance.department else 'None'
                    new_department_name = new_department.name if new_department else 'None'
                    updated_fields.append(f"Department changed from '{old_department_name}' to '{new_department_name}'")
                    instance.department = new_department
                except Department.DoesNotExist:
                    return Response({"error": f"Department with ID {new_department_id} not found."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Save basic info and department changes first
        if updated_fields:
            instance.save()
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
        Helper method to handle membership updates (add, remove, update roles).
        """
        # Add new members
        if 'add_members' in request.data:
            new_members_data = request.data['add_members'] # Expects list of {'id': person_id, 'role': 'role_name'}
            
            for member_data in new_members_data:
                person_id = member_data.get('id')
                role = member_data.get('role', 'Member') # Default role if not specified
                if person_id:
                    try:
                        person = Person.objects.get(id=person_id)
                        # Create or update role assignment
                        role_obj, created = TeamMemberRole.objects.update_or_create(
                            person=person,
                            team=team,
                            defaults={'role': role}
                        )
                        # Update person's team field (optional, depends on model logic)
                        # person.team = team
                        # person.save()
                        
                        # Record history
                        if created:
                            record_team_member_addition(team, person_id)
                            record_team_role_assignment(team, person_id, role)
                        else:
                            # If role changed during update_or_create
                            # We might need to check the previous role to record a change accurately
                            # For simplicity, we record assignment here, but a more robust check could be added
                            record_team_role_change(team, person_id, role) # Or assignment if preferred
                            
                    except Person.DoesNotExist:
                        # Handle error: person not found
                        print(f"Warning: Person with ID {person_id} not found during add_members.")
                        pass # Or raise an error / return a specific response
        
        # Remove members
        if 'remove_members' in request.data:
            member_ids_to_remove = request.data['remove_members'] # Expects list of person_ids
            
            for person_id in member_ids_to_remove:
                try:
                    # Find the role(s) to remove
                    roles_removed = TeamMemberRole.objects.filter(person_id=person_id, team=team)
                    if roles_removed.exists():
                        for role_obj in roles_removed:
                            role_name = role_obj.role
                            role_obj.delete()
                            # Record history for each role removal
                            record_team_member_removal(team, person_id)
                            record_team_role_removal(team, person_id, role_name) # Record specific role removal
                        
                        # Optionally clear the person's team field
                        # person = Person.objects.get(id=person_id)
                        # if person.team == team:
                        #     person.team = None
                        #     person.save()
                    else:
                         print(f"Warning: Person with ID {person_id} not found in team {team.id} during remove_members.")

                except Person.DoesNotExist:
                     print(f"Warning: Person with ID {person_id} not found during remove_members.")
                     pass
        
        # Update member roles (alternative or complementary to add_members)
        if 'update_member_roles' in request.data:
            role_updates = request.data['update_member_roles'] # Expects list of {'id': person_id, 'role': 'new_role_name'}
            
            for update in role_updates:
                person_id = update.get('id')
                new_role = update.get('role')
                if person_id and new_role:
                    try:
                        role_obj, created = TeamMemberRole.objects.update_or_create(
                            person_id=person_id,
                            team=team,
                            defaults={'role': new_role}
                        )
                        # Record history
                        if created:
                             record_team_role_assignment(team, person_id, new_role)
                        else:
                             # Again, a more robust check for actual change might be needed
                             record_team_role_change(team, person_id, new_role)
                    except Person.DoesNotExist:
                         print(f"Warning: Person with ID {person_id} not found during update_member_roles.")
                         pass
