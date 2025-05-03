from django.db import models
import uuid

class Person(models.Model):
    id = models.AutoField(primary_key=True)
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    contact_id = models.CharField(max_length=100, unique=True)
    # Change from ForeignKey to ManyToManyField to allow a person to be in multiple teams
    teams = models.ManyToManyField('Team', related_name='members', blank=True)
    department = models.ForeignKey('Department', on_delete=models.SET_NULL, null=True, blank=True, related_name='persons')
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
        if not self.contact_id:
            self.contact_id = f"{uuid.uuid4().hex}person"
        
        super().save(*args, **kwargs)
