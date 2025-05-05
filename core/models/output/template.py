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

