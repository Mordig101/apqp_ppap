from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from core.models import Team, Person, TeamMemberRole, Department, History
from django.contrib.auth.models import User

class TeamAPITestCase(TestCase):
    """
    Test case for Team API endpoints
    """
    
    def setUp(self):
        """Set up test data"""
        # Create a test user
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            email='test@example.com'
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
        
        # Create team member roles
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
        self.assertEqual(len(response.data['results']), 2)  # Assuming pagination is enabled
        
        # Check if member count is included
        self.assertIn('member_count', response.data['results'][0])
        self.assertEqual(response.data['results'][0]['member_count'], 2)  # team1 has 2 members
    
    def test_get_team_detail(self):
        """Test retrieving a single team with details"""
        url = reverse('team-detail', args=[self.team1.id])
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Development Team')
        self.assertEqual(response.data['description'], 'Frontend and Backend Developers')
        
        # Check if member count is included
        self.assertIn('member_count', response.data)
        self.assertEqual(response.data['member_count'], 2)
        
        # Check if history is included
        self.assertIn('history', response.data)
    
    def test_create_team(self):
        """Test creating a new team"""
        url = reverse('team-list')
        data = {
            'name': 'New Test Team',
            'description': 'This is a test team',
            'department_id': self.department1.id,
            'members': [self.person3.id],
            'member_roles': {
                str(self.person3.id): 'QA Engineer'
            }
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Team.objects.count(), 3)
        
        # Check if the team was created with correct data
        new_team = Team.objects.get(name='New Test Team')
        self.assertEqual(new_team.description, 'This is a test team')
        self.assertEqual(new_team.department, self.department1)
        
        # Check if member role was created
        role = TeamMemberRole.objects.filter(person=self.person3, team=new_team).first()
        self.assertIsNotNone(role)
        self.assertEqual(role.role, 'QA Engineer')
        
        # Check if history was created
        history_records = History.objects.filter(history_id=new_team.history_id)
        self.assertTrue(history_records.exists())
    
    def test_update_team_basic_info(self):
        """Test updating basic team information"""
        url = reverse('team-detail', args=[self.team1.id])
        data = {
            'name': 'Updated Team Name',
            'description': 'Updated team description',
            'department_id': self.department2.id
        }
        
        response = self.client.put(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Refresh the team instance from the database
        self.team1.refresh_from_db()
        
        # Check if the team was updated with correct data
        self.assertEqual(self.team1.name, 'Updated Team Name')
        self.assertEqual(self.team1.description, 'Updated team description')
        self.assertEqual(self.team1.department, self.department2)
        
        # Check if history was created for the update
        history_records = History.objects.filter(
            history_id=self.team1.history_id, 
            event__contains='Team updated'
        )
        self.assertTrue(history_records.exists())
    
    def test_update_team_with_members(self):
        """Test updating team with member management"""
        url = reverse('team-detail', args=[self.team1.id])
        data = {
            'name': 'Development Team',
            'add_members': [
                {'id': self.person3.id, 'role': 'QA Engineer'}
            ],
            'remove_members': [self.person2.id]
        }
        
        response = self.client.put(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check if members were correctly added and removed
        self.assertTrue(
            TeamMemberRole.objects.filter(
                person=self.person3, 
                team=self.team1,
                role='QA Engineer'
            ).exists()
        )
        
        self.assertFalse(
            TeamMemberRole.objects.filter(
                person=self.person2, 
                team=self.team1
            ).exists()
        )
        
        # Check if history was created for member changes
        history_records = History.objects.filter(
            history_id=self.team1.history_id, 
            event__contains='Person'
        )
        self.assertTrue(history_records.exists())
    
    def test_update_team_roles(self):
        """Test updating team member roles"""
        url = reverse('team-detail', args=[self.team1.id])
        data = {
            'update_member_roles': [
                {'id': self.person1.id, 'role': 'Project Manager'}
            ]
        }
        
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check if role was updated
        role = TeamMemberRole.objects.get(person=self.person1, team=self.team1)
        self.assertEqual(role.role, 'Project Manager')
        
        # Check if history was created for role change
        history_records = History.objects.filter(
            history_id=self.team1.history_id, 
            event__contains='role changed'
        )
        self.assertTrue(history_records.exists())
    
    def test_delete_team(self):
        """Test deleting a team"""
        url = reverse('team-detail', args=[self.team1.id])
        
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Team.objects.filter(id=self.team1.id).exists())
        
        # Check if history was created for team deletion
        history_records = History.objects.filter(
            event__contains=f'Team deleted with ID {self.team1.id}'
        )
        self.assertTrue(history_records.exists())
    
    def test_assign_members_endpoint(self):
        """Test the assign_members endpoint"""
        url = reverse('team-assign-members', args=[self.team2.id])
        data = {
            'members': [self.person1.id, self.person3.id],
            'member_roles': {
                str(self.person1.id): 'Technical Lead',
                str(self.person3.id): 'QA Analyst'
            }
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check if members were assigned with correct roles
        self.assertTrue(
            TeamMemberRole.objects.filter(
                person=self.person1, 
                team=self.team2, 
                role='Technical Lead'
            ).exists()
        )
        
        self.assertTrue(
            TeamMemberRole.objects.filter(
                person=self.person3, 
                team=self.team2, 
                role='QA Analyst'
            ).exists()
        )
    
    def test_filtering_by_department(self):
        """Test filtering teams by department"""
        url = f"{reverse('team-list')}?department_id={self.department1.id}"
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # There should be only one team in department1 (Engineering Department)
        result_data = response.data['results'] if 'results' in response.data else response.data
        self.assertEqual(len(result_data), 1)
        self.assertEqual(result_data[0]['name'], 'Development Team')
    
    def test_search_by_name(self):
        """Test searching teams by name"""
        url = f"{reverse('team-list')}?search=QA"
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # There should be only one team with 'QA' in name
        result_data = response.data['results'] if 'results' in response.data else response.data
        self.assertEqual(len(result_data), 1)
        self.assertEqual(result_data[0]['name'], 'QA Team')
    
    def test_error_handling_invalid_department(self):
        """Test error handling when providing invalid department ID"""
        url = reverse('team-detail', args=[self.team1.id])
        data = {
            'name': 'Test Team',
            'department_id': 9999  # Non-existent department
        }
        
        response = self.client.put(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('Department with id 9999 does not exist', response.data['error'])
