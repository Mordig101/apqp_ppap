from django.db import models
import json

class FastQuery(models.Model):
    id = models.AutoField(primary_key=True)
    project = models.OneToOneField('Project', on_delete=models.CASCADE, related_name='fastquery')
    index = models.JSONField(default=dict)  # Stores index information as JSON

    class Meta:
        db_table = 'fastquery'

    def __str__(self):
        return f"FastQuery for Project {self.project_id}"

    def save(self, *args, **kwargs):
        # Ensure index is JSON
        if isinstance(self.index, str):
            try:
                self.index = json.loads(self.index)
            except json.JSONDecodeError:
                self.index = {"error": "Invalid JSON"}
        
        super().save(*args, **kwargs)
