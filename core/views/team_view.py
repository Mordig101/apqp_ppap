from rest_framework import viewsets, status
from rest_framework.response import Response
from django.db import transaction
from core.models import Team, Person
from core.serializers.team_serializer import TeamSerializer
from core.services.history.initialization import initialize_history

class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        # Extract team data
        name = request.data.get('name')
        description = request.data.get('description', '')
        members = request.data.get('members', [])
        
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
                Person.objects.filter(id__in=members).update(team=team)
            
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
