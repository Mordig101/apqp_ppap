from django.db import models
import uuid

class History(models.Model):
    id = models.CharField(max_length=100, primary_key=True)
    history_id = models.CharField(max_length=100, db_index=True)  # Added for relationship tracking
    title = models.CharField(max_length=255)
    event = models.TextField()
    table_name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.CharField(max_length=255, null=True, blank=True)  # Who made the change
    started_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(null=True, blank=True)
    deadline = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'history'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.created_at}"
