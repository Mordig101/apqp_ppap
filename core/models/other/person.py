from django.db import models
import uuid

class Person(models.Model):
    id = models.AutoField(primary_key=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    contact_id = models.CharField(max_length=100, unique=True)
    team = models.ForeignKey('Team', on_delete=models.SET_NULL, null=True, related_name='members')
    department = models.ForeignKey('Department', on_delete=models.SET_NULL, null=True, related_name='members')
    is_user = models.BooleanField(default=False)
    history_id = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = 'person'
        ordering = ['last_name', 'first_name']

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    def save(self, *args, **kwargs):
        # Generate history_id if not provided
        if not self.history_id:
            self.history_id = f"{uuid.uuid4().hex}person"
        
        # Generate contact_id if not provided
        if not self.contact_id and self.id:
            self.contact_id = f"{self.id}person"
        
        super().save(*args, **kwargs)
