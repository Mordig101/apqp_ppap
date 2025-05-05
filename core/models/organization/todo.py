from django.db import models

class Todo(models.Model):
    id = models.AutoField(primary_key=True)
    permission = models.ForeignKey('Permission', on_delete=models.CASCADE, related_name='todos')
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='todos')
    output = models.ForeignKey('Output', on_delete=models.CASCADE, related_name='todos')

    class Meta:
        db_table = 'todo'
        ordering = ['-id']

    def __str__(self):
        return f"Todo for {self.user} on {self.output}"
    
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
            new_history_id = f"{self.id}todo"
            
            # Use update to avoid another save() call
            Todo.objects.filter(id=self.id).update(
                history_id=new_history_id
            )
            
            # Update the instance attribute to match the database
            self.history_id = new_history_id
        else:
            # For existing records, save normally
            super().save(*args, **kwargs)
