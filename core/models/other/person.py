from django.db import models
import uuid

class Person(models.Model):
    id = models.AutoField(primary_key=True)
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    contact_id = models.CharField(max_length=100, unique=True)
    # Change from ForeignKey to ManyToManyField to allow a person to be in multiple teams
    teams = models.ManyToManyField('Team', related_name='members', blank=True)
    department = models.ForeignKey('Department', on_delete=models.SET_NULL, null=True, blank=True, related_name='persons')
    is_user = models.BooleanField(default=False)
    history_id = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = 'person'
        ordering = ['last_name', 'first_name']

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    def save(self, *args, **kwargs):
        # Prepare for a new record
        create_new = self.id is None
        
        # For new records, set a temporary unique values before first save
        if create_new:
            # Generate a temporary unique ID to avoid constraint violation
            import uuid
            temp_uuid = uuid.uuid4().hex
            
            # Set temporary unique values for constrained fields
            if not self.contact_id:
                self.contact_id = f"temp_{temp_uuid}"
            if not self.history_id:
                self.history_id = f"temp_{temp_uuid}"
            
            # First save to get an ID
            super().save(*args, **kwargs)
            
            # Now set the real IDs based on the person ID
            new_contact_id = f"{self.id}person"
            new_history_id = f"{self.id}person"
            
            # Use update to avoid another save() call
            Person.objects.filter(id=self.id).update(
                contact_id=new_contact_id,
                history_id=new_history_id
            )
            
            # Update the instance attributes to match the database
            self.contact_id = new_contact_id
            self.history_id = new_history_id
        else:
            # For existing records, save normally
            super().save(*args, **kwargs)
