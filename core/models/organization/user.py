from django.db import models
import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

class UserManager(BaseUserManager):
    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError('The Username field must be set')
        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(username, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=150, unique=True)
    password = models.CharField(max_length=128)
    person = models.OneToOneField('Person', on_delete=models.CASCADE, related_name='user')
    authorization = models.ForeignKey('Authorization', on_delete=models.CASCADE, related_name='users')
    last_login = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    history_id = models.CharField(max_length=100, unique=True)

    objects = UserManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = []

    class Meta:
        db_table = 'user'
        ordering = ['username']

    def __str__(self):
        return self.username

    def save(self, *args, **kwargs):
        # Prepare for a new record
        create_new = self.id is None
        
        # For new records, set a temporary unique value before first save
        if create_new:
            # Generate a temporary unique ID to avoid constraint violation
            import uuid
            temp_uuid = uuid.uuid4().hex
            
            # Set temporary unique values for constrained fields
            if not self.history_id:
                self.history_id = f"temp_{temp_uuid}"
            
            # First save to get an ID
            super().save(*args, **kwargs)
            
            # Now set the real ID based on the output ID
            new_history_id = f"{self.id}user"
            
            # Use update to avoid another save() call
            User.objects.filter(id=self.id).update(
                history_id=new_history_id
            )
            
            # Update the instance attribute to match the database
            self.history_id = new_history_id
        else:
            # For existing records, save normally
            super().save(*args, **kwargs)
