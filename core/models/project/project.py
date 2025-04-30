from django.db import models
import uuid

class Project(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    client = models.ForeignKey('Client', on_delete=models.CASCADE, related_name='projects')
    team = models.ForeignKey('Team', on_delete=models.CASCADE, related_name='projects')
    status = models.CharField(max_length=50, default='Planning')
    ppap = models.OneToOneField('PPAP', on_delete=models.CASCADE, related_name='related_project', null=True, blank=True)
    history_id = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = 'project'
        ordering = ['-id']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # Generate history_id if not provided
        if not self.history_id:
            self.history_id = f"{uuid.uuid4().hex}project"
        super().save(*args, **kwargs)
