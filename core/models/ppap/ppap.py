from django.db import models
import uuid

class PPAP(models.Model):
    id = models.AutoField(primary_key=True)
    project = models.ForeignKey('Project', on_delete=models.CASCADE, related_name='ppaps')
    level = models.IntegerField()
    status = models.CharField(max_length=50, default='Not Started')
    review = models.TextField(blank=True, null=True)
    history_id = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = 'ppap'
        ordering = ['-id']

    def __str__(self):
        return f"PPAP for Project {self.project} (Level {self.level})"

    def save(self, *args, **kwargs):
        # Prepare for a new record
        create_new = self.id is None
        
        # For new records, set a temporary unique values before first save
        if create_new:
            # Generate a temporary unique ID to avoid constraint violation
            import uuid
            temp_uuid = uuid.uuid4().hex
            
            # Set temporary unique values for constrained fields

            if not self.history_id:
                self.history_id = f"temp_{temp_uuid}"
            
            # First save to get an ID
            super().save(*args, **kwargs)
            
            # Now set the real IDs based on the ppap ID
            new_history_id = f"{self.id}ppap"
            
            # Use update to avoid another save() call
            PPAP.objects.filter(id=self.id).update(
                history_id=new_history_id
            )
            
            # Update the instance attributes to match the database
            self.history_id = new_history_id
        else:
            # For existing records, save normally
            super().save(*args, **kwargs)
