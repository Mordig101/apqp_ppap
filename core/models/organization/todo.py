from django.db import models

class Todo(models.Model):
    id = models.AutoField(primary_key=True)
    permission = models.ForeignKey('Permission', on_delete=models.CASCADE, related_name='todos')
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='todos')
    output = models.ForeignKey('Output', on_delete=models.CASCADE, related_name='todos')

    class Meta:
        db_table = 'todo'
        ordering = ['-id']

    def __str__(self):
        return f"Todo for {self.user} on {self.output}"
