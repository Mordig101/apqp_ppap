# In your Django app views.py or a dedicated auth_api.py
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
import jwt
from datetime import datetime, timedelta
from django.conf import settings
from core.models import User, Contact

@api_view(['POST'])
@permission_classes([AllowAny])
def api_login(request):
    """
    API endpoint for user login
    Returns JWT token and user data on successful login
    """
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response({
            'error': 'Please provide both username and password'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    user = authenticate(username=username, password=password)
    
    if user is not None:
        login(request, user)  # Create session for session-based auth
        
        # Generate JWT token
        payload = {
            'user_id': user.id,
            'username': user.username,
            'exp': datetime.utcnow() + timedelta(days=1)
        }
        token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
        
        # Create user object to return
        user_data = {
            'id': user.id,
            'username': user.username,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
        }
        
        # Add person data if available
        if hasattr(user, 'person'):
            user_data['first_name'] = user.person.first_name
            user_data['last_name'] = user.person.last_name
            
            # Try to get email from contact
            try:
                contact = Contact.objects.get(id=user.person.contact_id)
                user_data['email'] = contact.email
            except Contact.DoesNotExist:
                user_data['email'] = ""
        else:
            user_data['first_name'] = ""
            user_data['last_name'] = ""
            user_data['email'] = ""
        
        return Response({
            'token': token,
            'user': user_data
        })
    else:
        return Response({
            'error': 'Invalid credentials'
        }, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
def api_logout(request):
    """
    API endpoint for user logout
    """
    logout(request)
    return Response({
        'message': 'Successfully logged out'
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_get_user(request):
    """
    API endpoint to get current user data
    """
    user = request.user
    
    if not user.is_authenticated:
        return Response({
            'error': 'Not authenticated'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    # Create user object to return
    user_data = {
        'id': user.id,
        'username': user.username,
        'is_staff': user.is_staff,
        'is_superuser': user.is_superuser,
    }
    
    # Add person data if available
    if hasattr(user, 'person'):
        user_data['first_name'] = user.person.first_name
        user_data['last_name'] = user.person.last_name
        
        # Try to get email from contact
        try:
            contact = Contact.objects.get(id=user.person.contact_id)
            user_data['email'] = contact.email
        except Contact.DoesNotExist:
            user_data['email'] = ""
    else:
        user_data['first_name'] = ""
        user_data['last_name'] = ""
        user_data['email'] = ""
    
    return Response(user_data)