from django.db import models
import uuid

class Output(models.Model):
    id = models.AutoField(primary_key=True)
    template = models.ForeignKey('OutputTemplate', on_delete=models.CASCADE, related_name='outputs')
    description = models.TextField(blank=True, null=True)
    document = models.ForeignKey('Document', on_delete=models.SET_NULL, null=True, related_name='outputs')
    user = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, related_name='assigned_outputs')
    phase = models.ForeignKey('Phase', on_delete=models.CASCADE, related_name='outputs')
    status = models.CharField(max_length=50, default='Not Started')
    history_id = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = 'output'
        ordering = ['id']

    def __str__(self):
        return f"{self.template.name} for Phase {self.phase_id}"

    def save(self, *args, **kwargs):
        # Generate history_id if not provided
        if not self.history_id:
            self.history_id = f"{uuid.uuid4().hex}output"
        super().save(*args, **kwargs)
