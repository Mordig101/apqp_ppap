from django.db import models

class PPAPElement(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    level = models.CharField(max_length=50)  # Stores level information (e.g., "1,4,custom")

    class Meta:
        db_table = 'ppap_element'
        ordering = ['name']

    def __str__(self):
        return self.name
