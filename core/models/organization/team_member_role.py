from django.db import models
import uuid

class TeamMemberRole(models.Model):
    id = models.AutoField(primary_key=True)
    person = models.ForeignKey('Person', on_delete=models.CASCADE, related_name='team_roles')
    team = models.ForeignKey('Team', on_delete=models.CASCADE, related_name='member_roles')
    role = models.CharField(max_length=100)
    history_id = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = 'team_member_role'
        unique_together = ('person', 'team')

    def __str__(self):
        return f"{self.person} - {self.role} in {self.team}"
    
    def save(self, *args, **kwargs):
        # Generate history_id if not provided
        if not self.history_id:
            self.history_id = f"{uuid.uuid4().hex}teamrole"
        super().save(*args, **kwargs)
