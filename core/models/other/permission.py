from django.db import models
import uuid

class Permission(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=50)  # r (read only), e (edit and read)
    description = models.TextField(blank=True, null=True)
    history_id = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = 'permission'
        ordering = ['name']

    def __str__(self):
        return self.name

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
            new_history_id = f"{self.id}permission"
            
            # Use update to avoid another save() call
            Permission.objects.filter(id=self.id).update(
                history_id=new_history_id
            )
            
            # Update the instance attribute to match the database
            self.history_id = new_history_id
        else:
            # For existing records, save normally
            super().save(*args, **kwargs)
