from django.db import models
import uuid

class Document(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    file_path = models.CharField(max_length=255)
    file_type = models.CharField(max_length=50)
    file_size = models.BigIntegerField()
    uploader = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, related_name='uploaded_documents')
    output = models.ForeignKey('Output', on_delete=models.CASCADE, related_name='documents')
    version = models.CharField(max_length=50)
    status = models.CharField(max_length=50, default='Draft')
    history_id = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = 'document'
        ordering = ['-id']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # Generate history_id if not provided
        if not self.history_id:
            self.history_id = f"{uuid.uuid4().hex}document"
        super().save(*args, **kwargs)
