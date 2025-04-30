from django.db import models

class Contact(models.Model):
    id = models.CharField(max_length=100, primary_key=True)
    address = models.TextField()
    email = models.EmailField()
    phone = models.CharField(max_length=50)
    type = models.CharField(max_length=50)  # user, client, client_member
    history_id = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = 'contact'
        ordering = ['id']

    def __str__(self):
        return f"{self.type} Contact: {self.email}"
