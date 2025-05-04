from django.db import models
import uuid
import json

class Client(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    address = models.TextField()
    code = models.JSONField(default=dict)  # Stores code information as JSON
    description = models.TextField(blank=True, null=True)
    team = models.ForeignKey('Team', on_delete=models.SET_NULL, null=True, related_name='clients')
    contact_id = models.CharField(max_length=100, unique=True)
    history_id = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = 'client'
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        create_new = self.id is None
        
        # Generate IDs before first save for new objects
        if create_new:
            # Save once to get an ID
            super().save(*args, **kwargs)
            
            # Set the IDs
            self.contact_id = f"{self.id}client"
            self.history_id = f"{self.id}history"
            
            # Update only the specific fields
            kwargs['update_fields'] = ['contact_id', 'history_id'] if kwargs.get('update_fields') else None
            super().save(*args, **kwargs)
        else:
            # Normal save for updates
            super().save(*args, **kwargs)
        
        # Ensure code is JSON
        if isinstance(self.code, str):
            try:
                self.code = json.loads(self.code)
            except json.JSONDecodeError:
                self.code = {"value": self.code}
