from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from core.models import History, User
from django.utils import timezone

class HistoryAPITests(APITestCase):
    """
    Tests for the History API endpoints.
    Note: History API is read-only, so we only test list and retrieve operations
    """
    
    def setUp(self):
        # Create a test user
        self.user = User.objects.create_user(username='testuser', password='testpassword')
        self.client_api = APIClient()
        self.client_api.login(username='testuser', password='testpassword')
        
        # Create test history entries
        self.test_history = History.objects.create(
            event='Test Event',
            entity_type='PROJECT',
            entity_id=1,
            user=self.user,
            timestamp=timezone.now(),
            details={'action': 'create', 'description': 'Test description'}
        )
        
        # URLs
        self.list_url = reverse('history-list')
        self.detail_url = reverse('history-detail', kwargs={'pk': self.test_history.id})
        
    def test_list_history(self):
        """Test retrieving list of history entries"""
        response = self.client_api.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        
    def test_retrieve_history(self):
        """Test retrieving a specific history entry"""
        response = self.client_api.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['event'], self.test_history.event)
        
    def test_create_history_not_allowed(self):
        """Test that POST requests are not allowed (read-only API)"""
        data = {
            'event': 'New Event',
            'entity_type': 'PROJECT',
            'entity_id': 2,
            'details': {'action': 'update'}
        }
        response = self.client_api.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        
    def test_update_history_not_allowed(self):
        """Test that PUT requests are not allowed (read-only API)"""
        data = {
            'event': 'Updated Event'
        }
        response = self.client_api.put(self.detail_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        
    def test_delete_history_not_allowed(self):
        """Test that DELETE requests are not allowed (read-only API)"""
        response = self.client_api.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        
    def test_filter_by_entity_type(self):
        """Test filtering history by entity type"""
        response = self.client_api.get(f'{self.list_url}?entity_type=PROJECT')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        
    def test_filter_by_user(self):
        """Test filtering history by user"""
        response = self.client_api.get(f'{self.list_url}?user={self.user.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        
    def test_filter_by_date_range(self):
        """Test filtering history by date range"""
        today = timezone.now().date()
        response = self.client_api.get(
            f'{self.list_url}?from_date={today}&to_date={today}'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
