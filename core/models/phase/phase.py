from django.db import models
import uuid

class Phase(models.Model):
    id = models.AutoField(primary_key=True)
    template = models.ForeignKey('PhaseTemplate', on_delete=models.CASCADE, related_name='phases')
    responsible = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, related_name='responsible_phases')
    ppap = models.ForeignKey('PPAP', on_delete=models.CASCADE, related_name='phases')
    status = models.CharField(max_length=50, default='Not Started')
    history_id = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = 'phase'
        ordering = ['template__order']

    def __str__(self):
        return f"{self.template.name} for PPAP {self.ppap_id}"

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
            
            # Now set the real ID based on the phase ID
            new_history_id = f"{self.id}phase"
            
            # Use update to avoid another save() call
            Phase.objects.filter(id=self.id).update(
                history_id=new_history_id
            )
            
            # Update the instance attribute to match the database
            self.history_id = new_history_id
        else:
            # For existing records, save normally
            super().save(*args, **kwargs)
