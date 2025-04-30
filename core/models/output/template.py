from django.db import models
import json

class OutputTemplate(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    configuration = models.JSONField(default=dict)  # Stores configuration as JSON
    phase = models.ForeignKey('PhaseTemplate', on_delete=models.CASCADE, related_name='output_templates')
    ppap_element = models.ForeignKey('PPAPElement', on_delete=models.CASCADE, related_name='output_templates')

    class Meta:
        db_table = 'output_template'
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # Ensure configuration is JSON
        if isinstance(self.configuration, str):
            try:
                self.configuration = json.loads(self.configuration)
            except json.JSONDecodeError:
                self.configuration = {"error": "Invalid JSON"}
        
        super().save(*args, **kwargs)
