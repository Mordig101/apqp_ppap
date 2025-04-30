from django.db import models
import uuid

class Team(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    history_id = models.CharField(max_length=100, unique=True)
    department = models.ForeignKey('Department', null=True, blank=True, on_delete=models.SET_NULL, related_name='teams')

    class Meta:
        db_table = 'team'
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # Generate history_id if not provided
        if not self.history_id:
            self.history_id = f"{uuid.uuid4().hex}team"
        super().save(*args, **kwargs)
