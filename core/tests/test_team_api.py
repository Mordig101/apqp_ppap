from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from core.models import Team, Person, TeamMemberRole, Department, History, User, Authorization

class TeamAPITestCase(TestCase):
    """
    Test case for Team API endpoints (Simplified)
    """

    def setUp(self):
        """Set up test data"""
        # Create a dummy Person for the test user
        self.test_person = Person.objects.create(
            first_name='Test',
            last_name='UserPerson'
        )

        # Create a dummy Authorization for the test user
        self.test_authorization = Authorization.objects.create(
            name='Test Auth'
        )

        # Create a test user using the custom User model, linking Person and Authorization
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            person=self.test_person,
            authorization=self.test_authorization
        )

        # Create test departments
        self.department1 = Department.objects.create(
            name='Engineering Department'
        )

        self.department2 = Department.objects.create(
            name='Quality Department'
        )

        # Create test persons
        self.person1 = Person.objects.create(
            first_name='John',
            last_name='Doe'
        )

        self.person2 = Person.objects.create(
            first_name='Jane',
            last_name='Smith'
        )

        self.person3 = Person.objects.create(
            first_name='Bob',
            last_name='Johnson'
        )

        # Create test teams
        self.team1 = Team.objects.create(
            name='Development Team',
            description='Frontend and Backend Developers',
            department=self.department1
        )

        self.team2 = Team.objects.create(
            name='QA Team',
            description='Quality Assurance Team',
            department=self.department2
        )

        # Create initial team member roles for team1
        TeamMemberRole.objects.create(
            person=self.person1,
            team=self.team1,
            role='Team Lead'
        )

        TeamMemberRole.objects.create(
            person=self.person2,
            team=self.team1,
            role='Developer'
        )

        # Initialize the API client
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_get_team_list(self):
        """Test retrieving a list of teams"""
        url = reverse('team-list')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check if the response data is paginated
        if 'results' in response.data:
            self.assertEqual(len(response.data['results']), 2)
            # Check if member count is included in the first team
            self.assertIn('member_count', response.data['results'][0])
            self.assertEqual(response.data['results'][0]['member_count'], 2) # team1 has 2 members
        else:
            # Handle non-paginated response if applicable
            self.assertEqual(len(response.data), 2)
            self.assertIn('member_count', response.data[0])
            self.assertEqual(response.data[0]['member_count'], 2)


    def test_create_team(self):
        """Test creating a new team with initial members and roles"""
        url = reverse('team-list')
        data = {
            'name': 'New Test Team',
            'description': 'This is a test team',
            'department_id': self.department1.id,
            'members': [self.person3.id], # Pass member IDs directly
            'member_roles': { # Pass roles keyed by person ID
                str(self.person3.id): 'QA Engineer'
            }
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, f"Error: {response.data}")
        self.assertEqual(Team.objects.count(), 3) # Should have 3 teams now

        # Check if the team was created with correct data
        new_team = Team.objects.get(name='New Test Team')
        self.assertEqual(new_team.description, 'This is a test team')
        self.assertEqual(new_team.department, self.department1)

        # Check if member role was created correctly
        role = TeamMemberRole.objects.filter(person=self.person3, team=new_team).first()
        self.assertIsNotNone(role)
        self.assertEqual(role.role, 'QA Engineer')

        # Optional: Check if history was created (if history tracking is crucial for this test)
        # history_records = History.objects.filter(history_id=new_team.history_id)
        # self.assertTrue(history_records.exists())

    def test_update_team_with_members(self):
        """Test updating team by adding and removing members"""
        url = reverse('team-detail', args=[self.team1.id])
        data = {
            # Include required fields for PUT or use PATCH if only changing members
            'name': self.team1.name, # Keep existing name or update if needed
            'description': self.team1.description, # Keep existing description
            'department_id': self.team1.department.id, # Keep existing department
            'add_members': [
                {'id': self.person3.id, 'role': 'QA Engineer'} # Add person3
            ],
            'remove_members': [self.person2.id] # Remove person2
        }

        # Use PUT for full update or PATCH if the view supports partial updates for members
        response = self.client.put(url, data, format='json') # Or self.client.patch

        self.assertEqual(response.status_code, status.HTTP_200_OK, f"Error: {response.data}")

        # Refresh team1 state if needed (though checks below query the DB directly)
        # self.team1.refresh_from_db()

        # Check if person3 was added with the correct role
        self.assertTrue(
            TeamMemberRole.objects.filter(
                person=self.person3,
                team=self.team1,
                role='QA Engineer'
            ).exists()
        )

        # Check if person2 was removed (their TeamMemberRole for this team should be gone)
        self.assertFalse(
            TeamMemberRole.objects.filter(
                person=self.person2,
                team=self.team1
            ).exists()
        )

        # Check if person1 is still in the team (was not in remove_members)
        self.assertTrue(
            TeamMemberRole.objects.filter(
                person=self.person1,
                team=self.team1
            ).exists()
        )

        # Optional: Check history records for member changes
        # history_records_add = History.objects.filter(history_id=self.team1.history_id, event__contains=f'Person {self.person3.id} added')
        # self.assertTrue(history_records_add.exists())
        # history_records_remove = History.objects.filter(history_id=self.team1.history_id, event__contains=f'Person {self.person2.id} removed')
        # self.assertTrue(history_records_remove.exists())

# Keep only the tests requested by the user.
# Removed:
# - test_get_team_detail
# - test_update_team_basic_info
# - test_update_team_roles
# - test_delete_team
# - test_assign_members_endpoint
# - test_filtering_by_department
# - test_search_by_name
# - test_error_handling_invalid_department (if it existed)
