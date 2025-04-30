from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from core.models import (
    Project, PPAP, Phase, Output, Document, User, Client, Team,
    Person, Contact, Department, History, FastQuery, PhaseTemplate,
    OutputTemplate, PPAPElement, Todo, Permission, Authorization
)
from core.serializers import (
    ProjectSerializer, PPAPSerializer, PhaseSerializer, OutputSerializer,
    DocumentSerializer, UserSerializer, ClientSerializer, TeamSerializer,
    PersonSerializer, ContactSerializer, DepartmentSerializer, HistorySerializer,
    FastQuerySerializer, PhaseTemplateSerializer, OutputTemplateSerializer,
    PPAPElementSerializer, TodoSerializer, PermissionSerializer, AuthorizationSerializer
)
from core.services.project.initialization import initialize_project
from core.services.history.initialization import initialize_history

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        # Extract data for project initialization
        name = request.data.get('name')
        description = request.data.get('description', '')
        client_id = request.data.get('client_id')
        team_id = request.data.get('team_id')
        ppap_level = request.data.get('ppap_level', 3)
        
        # Validate required fields
        if not all([name, client_id, team_id]):
            return Response(
                {"error": "Missing required fields: name, client_id, team_id"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Initialize project with all related records
        try:
            project = initialize_project(name, description, client_id, team_id, ppap_level)
            serializer = self.get_serializer(project)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        project = self.get_object()
        history_records = History.objects.filter(id=project.history_id)
        serializer = HistorySerializer(history_records, many=True)
        return Response(serializer.data)

class PPAPViewSet(viewsets.ModelViewSet):
    queryset = PPAP.objects.all()
    serializer_class = PPAPSerializer
    
    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        ppap = self.get_object()
        history_records = History.objects.filter(id=ppap.history_id)
        serializer = HistorySerializer(history_records, many=True)
        return Response(serializer.data)

class PhaseViewSet(viewsets.ModelViewSet):
    queryset = Phase.objects.all()
    serializer_class = PhaseSerializer
    
    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        phase = self.get_object()
        history_records = History.objects.filter(id=phase.history_id)
        serializer = HistorySerializer(history_records, many=True)
        return Response(serializer.data)

class OutputViewSet(viewsets.ModelViewSet):
    queryset = Output.objects.all()
    serializer_class = OutputSerializer
    
    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        output = self.get_object()
        history_records = History.objects.filter(id=output.history_id)
        serializer = HistorySerializer(history_records, many=True)
        return Response(serializer.data)
    
    @transaction.atomic
    def update(self, request, *args, **kwargs):
        output = self.get_object()
        serializer = self.get_serializer(output, data=request.data, partial=True)
        
        if serializer.is_valid():
            # Save the output
            output = serializer.save()
            
            # Record the update in history
            initialize_history(
                title=f"{output.template.name}",
                event=f"Output updated: {', '.join(request.data.keys())}",
                table_name='output',
                history_id=output.history_id
            )
            
            # Check if status changed to 'Completed'
            if 'status' in request.data and request.data['status'] == 'Completed':
                # Update phase status if all outputs are completed
                phase = output.phase
                all_outputs_completed = all(o.status == 'Completed' for o in phase.outputs.all())
                
                if all_outputs_completed and phase.status != 'Completed':
                    phase.status = 'Completed'
                    phase.save()
                    
                    # Record phase completion in history
                    initialize_history(
                        title=f"{phase.template.name}",
                        event=f"Phase marked as Completed as all outputs are completed",
                        table_name='phase',
                        history_id=phase.history_id
                    )
                    
                    # Check if all phases are completed to update PPAP status
                    ppap = phase.ppap
                    all_phases_completed = all(p.status == 'Completed' for p in ppap.phases.all())
                    
                    if all_phases_completed and ppap.status != 'Completed':
                        ppap.status = 'Completed'
                        ppap.save()
                        
                        # Record PPAP completion in history
                        initialize_history(
                            title=f"PPAP for Project {ppap.project_id}",
                            event=f"PPAP marked as Completed as all phases are completed",
                            table_name='ppap',
                            history_id=ppap.history_id
                        )
            
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        # Extract data
        name = request.data.get('name')
        description = request.data.get('description', '')
        output_id = request.data.get('output_id')
        file_type = request.data.get('file_type')
        file_content = request.data.get('file_content')  # Base64 encoded content
        
        # Validate required fields
        if not all([name, output_id, file_type, file_content]):
            return Response(
                {"error": "Missing required fields: name, output_id, file_type, file_content"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # TODO: Handle file storage (simplified for this implementation)
        file_path = f"documents/{name}.{file_type}"
        file_size = len(file_content)
        
        # Create document
        try:
            document = Document.objects.create(
                name=name,
                description=description,
                file_path=file_path,
                file_type=file_type,
                file_size=file_size,
                uploader_id=request.user.id,
                output_id=output_id,
                version="1.0",
                status="Draft"
            )
            
            # Record in history
            initialize_history(
                title=name,
                event=f"Document uploaded for Output {output_id}",
                table_name='document',
                history_id=document.history_id
            )
            
            serializer = self.get_serializer(document)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        # Extract user data
        username = request.data.get('username')
        password = request.data.get('password')
        first_name = request.data.get('first_name')
        last_name = request.data.get('last_name')
        email = request.data.get('email')
        department_id = request.data.get('department_id')
        team_id = request.data.get('team_id')
        authorization_id = request.data.get('authorization_id')
        
        # Validate required fields
        if not all([username, password, first_name, last_name, email, authorization_id]):
            return Response(
                {"error": "Missing required fields"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Create person record
            person = Person.objects.create(
                first_name=first_name,
                last_name=last_name,
                department_id=department_id,
                team_id=team_id,
                is_user=True
            )
            
            # Create contact record
            contact = Contact.objects.create(
                id=person.contact_id,
                email=email,
                address="",
                phone="",
                type="user"
            )
            
            # Create user
            user = User.objects.create_user(
                username=username,
                password=password,
                person=person,
                authorization_id=authorization_id
            )
            
            # Record in history
            initialize_history(
                title=username,
                event=f"User created with ID {user.id}",
                table_name='user',
                history_id=user.history_id
            )
            
            serializer = self.get_serializer(user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        # Extract client data
        name = request.data.get('name')
        address = request.data.get('address')
        code = request.data.get('code', {})
        description = request.data.get('description', '')
        contact_data = request.data.get('contact', {})
        
        # Validate required fields
        if not all([name, address]):
            return Response(
                {"error": "Missing required fields: name, address"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Create client
            client = Client.objects.create(
                name=name,
                address=address,
                code=code,
                description=description
            )
            
            # Create contact
            contact = Contact.objects.create(
                id=client.contact_id,
                address=contact_data.get('address', address),
                email=contact_data.get('email', ''),
                phone=contact_data.get('phone', ''),
                type='client'
            )
            
            # Record in history
            initialize_history(
                title=name,
                event=f"Client created with ID {client.id}",
                table_name='client',
                history_id=client.history_id
            )
            
            serializer = self.get_serializer(client)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

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

class HistoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = History.objects.all()
    serializer_class = HistorySerializer
    
    @action(detail=False, methods=['get'])
    def project(self, request, project_id=None):
        project_id = request.query_params.get('project_id')
        if not project_id:
            return Response(
                {"error": "Missing required parameter: project_id"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            project = Project.objects.get(id=project_id)
            history_records = History.objects.filter(id=project.history_id)
            
            # Get related history records
            if project.ppap:
                ppap_history = History.objects.filter(id=project.ppap.history_id)
                history_records = history_records.union(ppap_history)
                
                # Get phase history
                for phase in project.ppap.phases.all():
                    phase_history = History.objects.filter(id=phase.history_id)
                    history_records = history_records.union(phase_history)
                    
                    # Get output history
                    for output in phase.outputs.all():
                        output_history = History.objects.filter(id=output.history_id)
                        history_records = history_records.union(output_history)
            
            serializer = self.get_serializer(history_records, many=True)
            return Response(serializer.data)
        except Project.DoesNotExist:
            return Response(
                {"error": f"Project with ID {project_id} not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
