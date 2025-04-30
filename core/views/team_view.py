from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction
from core.models import Team, Person, TeamMemberRole
from core.serializers.team_serializer import TeamSerializer
from core.serializers.team_member_role_serializer import TeamMemberRoleSerializer
from core.services.history.initialization import initialize_history
from core.services.history.team_role import record_team_role_assignment, record_team_role_change

class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    
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
