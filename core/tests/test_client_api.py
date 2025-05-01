from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from core.models import Client, User

class ClientAPITests(APITestCase):
    """
    Tests for the Client API endpoints.
    """
    
    def setUp(self):
        # Create a test user
        self.user = User.objects.create_user(username='testuser', password='testpassword')
        self.client_api = APIClient()
        self.client_api.login(username='testuser', password='testpassword')
        
        # Create test client data
        self.test_client = Client.objects.create(
            name='Test Company',
            address='123 Test St',
            contact_email='test@company.com',
            phone_number='+1234567890'
        )
        
        # URLs
        self.list_url = reverse('client-list')
        self.detail_url = reverse('client-detail', kwargs={'pk': self.test_client.id})
        
    def test_list_clients(self):
        """Test retrieving list of clients"""
        response = self.client_api.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        
    def test_create_client(self):
        """Test creating a new client"""
        data = {
            'name': 'New Company',
            'address': '456 New St',
            'contact_email': 'new@company.com',
            'phone_number': '+0987654321'
        }
        response = self.client_api.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Client.objects.count(), 2)
        
    def test_retrieve_client(self):
        """Test retrieving a specific client"""
        response = self.client_api.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], self.test_client.name)
        
    def test_update_client(self):
        """Test updating a client"""
        data = {
            'name': 'Updated Company',
            'address': self.test_client.address,
            'contact_email': self.test_client.contact_email,
            'phone_number': self.test_client.phone_number
        }
        response = self.client_api.put(self.detail_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Updated Company')
        
    def test_delete_client(self):
        """Test deleting a client"""
        response = self.client_api.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Client.objects.count(), 0)
        
    def test_filter_clients(self):
        """Test filtering clients"""
        Client.objects.create(
            name='Another Company',
            address='789 Test St',
            contact_email='another@company.com',
            phone_number='+1122334455'
        )
        response = self.client_api.get(f'{self.list_url}?search=Test Company')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'Test Company')
