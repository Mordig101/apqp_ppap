from django.db import models
import uuid

class Authorization(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=50)  # admin, create, edit
    history_id = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = 'authorization'
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # Generate history_id if not provided
        if not self.history_id:
            self.history_id = f"{self.id}authorization"
        super().save(*args, **kwargs)
