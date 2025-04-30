from rest_framework import viewsets, status
from rest_framework.response import Response
from django.db import transaction
from core.models import User, Person, Contact
from core.serializers.user_serializer import UserSerializer
from core.services.history.initialization import initialize_history

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
