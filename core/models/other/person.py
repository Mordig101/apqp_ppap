from django.db import models
import uuid

class Person(models.Model):
    id = models.AutoField(primary_key=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    # Allow null temporarily during save, ensure unique=True is enforced by DB
    contact_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
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
        # Generate history_id only if it's a new object and history_id is not set
        if not self.pk and not self.history_id:
            self.history_id = f"{uuid.uuid4().hex}person"

        # Determine if this is a new object before saving
        is_new = self.pk is None

        # Save the object (this assigns self.pk if is_new)
        super().save(*args, **kwargs)

        # Generate contact_id if it's a new object and contact_id was not provided
        if is_new and not self.contact_id:
            self.contact_id = f"{self.id}person"
            # Update only the contact_id field to avoid recursion and ensure uniqueness
            Person.objects.filter(pk=self.pk).update(contact_id=self.contact_id)
            # Refresh the field in the current instance if necessary
            # self.refresh_from_db(fields=['contact_id'])
