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
        # Generate history_id if not provided
        if not self.history_id:
            self.history_id = f"{uuid.uuid4().hex}phase"
        super().save(*args, **kwargs)
