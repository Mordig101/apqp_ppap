from django.db import models
import uuid  # Add this import at the top

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
    
    # Add this save method to ensure history_id is always generated
    def save(self, *args, **kwargs):
        # Generate history_id if not provided
        if not self.history_id:
            self.history_id = f"{uuid.uuid4().hex}contact"
        
        # Ensure id exists
        if not self.id:
            self.id = f"{uuid.uuid4().hex}contact" 
            
        super().save(*args, **kwargs)
