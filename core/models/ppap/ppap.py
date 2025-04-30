from django.db import models
import uuid

class PPAP(models.Model):
    id = models.AutoField(primary_key=True)
    project = models.ForeignKey('Project', on_delete=models.CASCADE, related_name='ppaps')
    level = models.IntegerField()
    status = models.CharField(max_length=50, default='Not Started')
    review = models.TextField(blank=True, null=True)
    history_id = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = 'ppap'
        ordering = ['-id']

    def __str__(self):
        return f"PPAP for Project {self.project_id} (Level {self.level})"

    def save(self, *args, **kwargs):
        # Generate history_id if not provided
        if not self.history_id:
            self.history_id = f"{uuid.uuid4().hex}ppap"
        super().save(*args, **kwargs)
