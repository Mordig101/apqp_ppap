import os
import time
import subprocess
from django.core.management.base import BaseCommand
from django.db import connection
from core.models import Team, Person
from django.db.utils import ProgrammingError, OperationalError

class Command(BaseCommand):
    help = 'Add is_user_team field to Team model, migrate, and update existing teams'

    def handle(self, *args, **options):
        # Step 1: Check if the field already exists
        self.stdout.write(self.style.WARNING('Checking if is_user_team field exists...'))
        field_exists = self._check_field_exists()
        
        if not field_exists:
            # Step 2: Create migration for adding is_user_team field
            self.stdout.write(self.style.WARNING('Creating migration for is_user_team field...'))
            self._create_migration()
            
            # Step 3: Apply the migration
            self.stdout.write(self.style.WARNING('Applying migration...'))
            self._apply_migration()
        else:
            self.stdout.write(self.style.SUCCESS('Field already exists, skipping migration.'))
        
        # Step 4: Update existing teams based on their member composition
        self.stdout.write(self.style.WARNING('Updating existing teams...'))
        self._update_teams()

        # Step 5: Seed teams (optional)
        if options.get('seed', False):
            self.stdout.write(self.style.WARNING('Seeding teams...'))
            self._seed_teams()
        
        self.stdout.write(self.style.SUCCESS('Team migration and update completed successfully!'))

    def add_arguments(self, parser):
        parser.add_argument(
            '--seed',
            action='store_true',
            help='Also seed additional teams after migration',
        )
        parser.add_argument(
            '--seed-count',
            type=int,
            default=5,
            help='Number of teams to seed (default: 5)',
        )

    def _check_field_exists(self):
        """Check if the is_user_team field already exists"""
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT is_user_team FROM team LIMIT 1")
            return True
        except (ProgrammingError, OperationalError):
            return False

    def _create_migration(self):
        """Create migration for adding is_user_team field"""
        try:
            result = subprocess.run(
                ['python', 'manage.py', 'makemigrations', 'core', '--name', 'add_is_user_team_field'],
                capture_output=True,
                text=True,
                check=True
            )
            self.stdout.write(result.stdout)
        except subprocess.CalledProcessError as e:
            self.stderr.write(self.style.ERROR(f"Migration creation error: {e.stderr}"))
            self.stderr.write(self.style.ERROR(f"Output: {e.stdout}"))
            raise

    def _apply_migration(self):
        """Apply the migration"""
        try:
            result = subprocess.run(
                ['python', 'manage.py', 'migrate', 'core'],
                capture_output=True,
                text=True,
                check=True
            )
            self.stdout.write(result.stdout)
        except subprocess.CalledProcessError as e:
            self.stderr.write(self.style.ERROR(f"Migration application error: {e.stderr}"))
            self.stderr.write(self.style.ERROR(f"Output: {e.stdout}"))
            raise
        
        # Small delay to ensure migrations are processed fully
        time.sleep(1)

    def _update_teams(self):
        """Update existing teams based on their members"""
        count = 0
        for team in Team.objects.all():
            try:
                has_users = team.members.filter(is_user=True).exists()
                if team.is_user_team != has_users:
                    team.is_user_team = has_users
                    team.save(update_fields=['is_user_team'])
                    count += 1
            except Exception as e:
                self.stderr.write(self.style.ERROR(f"Error updating team {team.id}: {str(e)}"))
        
        if count > 0:
            self.stdout.write(self.style.SUCCESS(f'Updated {count} teams'))
        else:
            self.stdout.write(self.style.SUCCESS(f'All teams already have correct is_user_team values'))

    def _seed_teams(self):
        """Seed additional teams with correct is_user_team values"""
        from core.seeder.history_seeder import create_history_record
        count = self.options.get('seed_count', 5)
        
        # Split between user teams and client teams
        user_team_count = count // 2
        client_team_count = count - user_team_count
        teams_created = 0
        
        # Get available persons
        user_persons = list(Person.objects.filter(is_user=True))
        client_persons = list(Person.objects.filter(is_user=False))
        
        # Create user teams
        for i in range(user_team_count):
            try:
                # Create team
                team = Team.objects.create(
                    name=f"Development Team {i+1}",
                    description=f"Internal development team {i+1}",
                    is_user_team=True
                )
                
                # Create history record
                history = create_history_record(
                    title=f"Team: {team.name}",
                    table_name="team",
                    details=f"Created team {team.name}"
                )
                
                team.history_id = history.id
                team.save(update_fields=['history_id'])
                
                # Add some user members if available
                for person in user_persons[:3]:
                    team.members.add(person)
                
                teams_created += 1
            except Exception as e:
                self.stderr.write(self.style.ERROR(f"Error creating user team: {str(e)}"))
        
        # Create client teams
        for i in range(client_team_count):
            try:
                # Create team
                team = Team.objects.create(
                    name=f"Client Team {i+1}",
                    description=f"External client team {i+1}",
                    is_user_team=False
                )
                
                # Create history record
                history = create_history_record(
                    title=f"Team: {team.name}",
                    table_name="team",
                    details=f"Created team {team.name}"
                )
                
                team.history_id = history.id
                team.save(update_fields=['history_id'])
                
                # Add some client members if available
                for person in client_persons[:3]:
                    team.members.add(person)
                
                teams_created += 1
            except Exception as e:
                self.stderr.write(self.style.ERROR(f"Error creating client team: {str(e)}"))
        
        self.stdout.write(self.style.SUCCESS(f'Created {teams_created} new teams'))