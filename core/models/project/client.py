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
        # Generate history_id if not provided
        if not self.history_id:
            self.history_id = f"{uuid.uuid4().hex}client"
        
        # Generate contact_id if not provided
        if not self.contact_id and self.id:
            self.contact_id = f"{self.id}client"
        
        # Ensure code is JSON
        if isinstance(self.code, str):
            try:
                self.code = json.loads(self.code)
            except json.JSONDecodeError:
                self.code = {"value": self.code}
        
        super().save(*args, **kwargs)
