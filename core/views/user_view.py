from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from django.db import transaction
from core.models import User, Person, Contact, Authorization
from core.serializers.user_serializer import UserSerializer
from core.services.history.user import record_user_creation

class PublicRegistrationPermission(permissions.BasePermission):
    """
    Custom permission to allow:
    - Public POST requests for registration
    - Authenticated requests for all other operations
    """
    def has_permission(self, request, view):
        # Allow POST for everyone (registration)
        if request.method == 'POST':
            return True
            
        # For all other methods, require authentication
        return request.user and request.user.is_authenticated

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [PublicRegistrationPermission]
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        # Extract user data
        username = request.data.get('username')
        password = request.data.get('password')
        person_id = request.data.get('person_id')
        authorization_id = request.data.get('authorization_id')
        first_name = request.data.get('first_name')
        last_name = request.data.get('last_name')
        email = request.data.get('email')
        phone = request.data.get('phone')
        address = request.data.get('address')
        department_id = request.data.get('department_id')
        
        # Determine if this is a public registration
        is_public_registration = not request.user.is_authenticated if hasattr(request, 'user') else True
        
        # For authenticated admin users, respect their is_active setting
        # For public registration, default to inactive
        is_active = False if is_public_registration else request.data.get('is_active', True)
        is_staff = False if is_public_registration else request.data.get('is_staff', False)
        is_superuser = False if is_public_registration else request.data.get('is_superuser', False)
        
        # For public registration, use default authorization for new users
        if is_public_registration and not authorization_id:
            # Get or create basic user authorization - without description field
            try:
                default_auth = Authorization.objects.get(name="edit")
            except Authorization.DoesNotExist:
                # Create basic auth with a proper history_id
                import uuid
                default_auth = Authorization.objects.create(
                    name="edit",
                    history_id=f"{uuid.uuid4().hex}authorization"
                )
            
            authorization_id = default_auth.id
        
        # Validate required fields for user
        if not all([username, password, authorization_id]):
            return Response(
                {"error": "Missing required fields: username, password, authorization_id"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # If person_id is not provided, validate person creation fields
        if not person_id and not all([first_name, last_name]):
            return Response(
                {"error": "Either an existing person_id or first_name and last_name must be provided"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Rest of method remains unchanged...
            # Get or create person
            if person_id:
                try:
                    person = Person.objects.get(id=person_id)
                    
                    # Check if person is already a user
                    if hasattr(person, 'user'):
                        return Response(
                            {"error": "This person is already associated with a user"},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    # Mark the person as a user
                    person.is_user = True
                    person.save(update_fields=['is_user'])
                    
                except Person.DoesNotExist:
                    return Response(
                        {"error": f"Person with ID {person_id} not found"},
                        status=status.HTTP_404_NOT_FOUND
                    )
            else:
                # Create a new person
                person = Person.objects.create(
                    first_name=first_name,
                    last_name=last_name,
                    department_id=department_id,
                    is_user=True
                )
            
            # Ensure contact exists for the person
            try:
                contact = Contact.objects.get(id=person.contact_id)
                
                # Update contact information if provided and different
                contact_updated = False
                
                if email and email != contact.email:
                    contact.email = email
                    contact_updated = True
                    
                if phone and phone != contact.phone:
                    contact.phone = phone
                    contact_updated = True
                    
                if address and address != contact.address:
                    contact.address = address
                    contact_updated = True
                    
                if contact_updated:
                    contact.save()
                    
            except Contact.DoesNotExist:
                # Create contact if it doesn't exist
                Contact.objects.create(
                    id=person.contact_id,
                    email=email or "",
                    phone=phone or "",
                    address=address or "",
                    type="user"
                )
            
            # Create user
            user = User.objects.create_user(
                username=username,
                password=password,
                person=person,
                authorization_id=authorization_id,
                is_active=is_active,
                is_staff=is_staff,
                is_superuser=is_superuser
            )
            
            # Record in history
            record_user_creation(user)
            
            response_data = self.get_serializer(user).data
            
            # For public registration, add appropriate message
            if is_public_registration:
                response_data['message'] = "Registration successful! Your account is pending approval."
            
            return Response(response_data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @transaction.atomic
    def update(self, request, *args, **kwargs):
        user = self.get_object()
        
        # Extract base user fields
        username = request.data.get('username', user.username)
        authorization_id = request.data.get('authorization_id')
        is_active = request.data.get('is_active', user.is_active)
        is_staff = request.data.get('is_staff', user.is_staff)
        is_superuser = request.data.get('is_superuser', user.is_superuser)
        
        # Extract person data if provided
        person_data = request.data.get('person_data', {})
        
        try:
            # Track what fields are updated
            user_updated_fields = []
            person_updated_fields = []
            
            # Update user fields
            if username != user.username:
                old_username = user.username
                user.username = username
                user_updated_fields.append('username')
                
            if is_active != user.is_active:
                user.is_active = is_active
                user_updated_fields.append('is_active')
                
            if is_staff != user.is_staff:
                user.is_staff = is_staff
                user_updated_fields.append('is_staff')
                
            if is_superuser != user.is_superuser:
                user.is_superuser = is_superuser
                user_updated_fields.append('is_superuser')
            
            # Update authorization if provided
            if authorization_id and authorization_id != user.authorization_id:
                try:
                    from core.models import Authorization
                    old_auth_id = user.authorization_id
                    authorization = Authorization.objects.get(id=authorization_id)
                    user.authorization = authorization
                    user_updated_fields.append('authorization')
                except Authorization.DoesNotExist:
                    return Response(
                        {"error": f"Authorization with ID {authorization_id} not found"},
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            # Save user changes if any fields were updated
            if user_updated_fields:
                user.save()
                
                # Record user update in history
                from core.services.history.user import record_user_update
                record_user_update(user, user_updated_fields)
                
                # If username changed, record that specifically
                if 'username' in user_updated_fields:
                    from core.services.history.user import record_user_name_change
                    record_user_name_change(user, old_username, username)
            
            # Update password if provided
            if 'password' in request.data:
                user.set_password(request.data['password'])
                user.save(update_fields=['password'])
                
                # Record password change in history
                from core.services.history.user import record_user_password_change
                record_user_password_change(user)
            
            # Update person data if provided
            if person_data:
                person = user.person
                old_first_name = person.first_name
                old_last_name = person.last_name
                name_changed = False
                
                # Update person fields if provided
                if 'first_name' in person_data and person_data['first_name'] != person.first_name:
                    person.first_name = person_data['first_name']
                    person_updated_fields.append('first_name')
                    name_changed = True
                    
                if 'last_name' in person_data and person_data['last_name'] != person.last_name:
                    person.last_name = person_data['last_name']
                    person_updated_fields.append('last_name')
                    name_changed = True
                
                # Update department if provided
                if 'department_id' in person_data:
                    department_id = person_data['department_id']
                    old_department_id = person.department.id if person.department else None
                    
                    if str(department_id) != str(old_department_id):
                        if department_id:
                            try:
                                from core.models import Department
                                department = Department.objects.get(id=department_id)
                                person.department = department
                                person_updated_fields.append('department')
                                
                                # Record department change
                                from core.services.history.person import record_person_department_change
                                record_person_department_change(person, old_department_id, department_id)
                            except Department.DoesNotExist:
                                return Response(
                                    {"error": f"Department with ID {department_id} not found"},
                                    status=status.HTTP_404_NOT_FOUND
                                )
                        else:
                            person.department = None
                            person_updated_fields.append('department')
                            
                            # Record department change
                            from core.services.history.person import record_person_department_change
                            record_person_department_change(person, old_department_id, None)
                
                # Save person changes if any fields were updated
                if person_updated_fields:
                    person.save()
                    
                    # Record person update in history
                    from core.services.history.person import record_person_update
                    record_person_update(person, person_updated_fields)
                    
                    # If name changed, record that specifically
                    if name_changed:
                        from core.services.history.person import record_person_name_change
                        record_person_name_change(
                            person, 
                            old_first_name, old_last_name, 
                            person.first_name, person.last_name
                        )
                
                # Update contact if email provided
                if 'email' in person_data:
                    try:
                        contact = Contact.objects.get(id=person.contact_id)
                        old_email = contact.email
                        new_email = person_data['email']
                        
                        if old_email != new_email:
                            contact.email = new_email
                            contact.save(update_fields=['email'])
                            
                            # Record email change
                            from core.services.history.contact import record_contact_email_change
                            record_contact_email_change(contact, old_email, new_email)
                    except Contact.DoesNotExist:
                        # Create contact if it doesn't exist
                        Contact.objects.create(
                            id=person.contact_id,
                            email=person_data['email'],
                            type='user'
                        )
            
            # Return updated user data
            serializer = self.get_serializer(user)
            return Response(serializer.data)
        except Exception as e:
            import traceback
            print(traceback.format_exc())  # Log the full error
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
