from django.db import models

class PhaseTemplate(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    order = models.IntegerField()

    class Meta:
        db_table = 'phase_template'
        ordering = ['order']

    def __str__(self):
        return self.name
    