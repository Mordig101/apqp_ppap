from django.db import models
import uuid

class Department(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    responsible = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, related_name='responsible_departments')
    history_id = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = 'department'
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # Generate history_id if not provided
        if not self.history_id:
            self.history_id = f"{uuid.uuid4().hex}department"
        super().save(*args, **kwargs)
