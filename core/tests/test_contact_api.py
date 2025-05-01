from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from core.models import Contact, Person, Client, User

class ContactAPITests(APITestCase):
    """
    Tests for the Contact API endpoints.
    """
    
    def setUp(self):
        # Create a test user
        self.user = User.objects.create_user(username='testuser', password='testpassword')
        self.client_api = APIClient()
        self.client_api.login(username='testuser', password='testpassword')
        
        # Create related test data
        self.test_client = Client.objects.create(
            name='Test Company',
            address='123 Test St',
            contact_email='test@company.com',
            phone_number='+1234567890'
        )
        
        self.test_person = Person.objects.create(
            first_name='John',
            last_name='Doe',
            is_user=False
        )
        
        # Create test contact
        self.test_contact = Contact.objects.create(
            person=self.test_person,
            client=self.test_client,
            contact_type='PRIMARY',
            email='john.doe@testcompany.com',
            phone='+1234567890'
        )
        
        # URLs
        self.list_url = reverse('contact-list')
        self.detail_url = reverse('contact-detail', kwargs={'pk': self.test_contact.id})
        
    def test_list_contacts(self):
        """Test retrieving list of contacts"""
        response = self.client_api.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        
    def test_create_contact(self):
        """Test creating a new contact"""
        data = {
            'person': self.test_person.id,
            'client': self.test_client.id,
            'contact_type': 'SECONDARY',
            'email': 'new.contact@testcompany.com',
            'phone': '+0987654321'
        }
        response = self.client_api.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Contact.objects.count(), 2)
        
    def test_retrieve_contact(self):
        """Test retrieving a specific contact"""
        response = self.client_api.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], self.test_contact.email)
        
    def test_update_contact(self):
        """Test updating a contact"""
        data = {
            'person': self.test_person.id,
            'client': self.test_client.id,
            'contact_type': 'PRIMARY',
            'email': 'updated.email@testcompany.com',
            'phone': self.test_contact.phone
        }
        response = self.client_api.put(self.detail_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'updated.email@testcompany.com')
        
    def test_delete_contact(self):
        """Test deleting a contact"""
        response = self.client_api.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Contact.objects.count(), 0)
        
    def test_filter_by_client(self):
        """Test filtering contacts by client"""
        response = self.client_api.get(f'{self.list_url}?client={self.test_client.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        
    def test_filter_by_person(self):
        """Test filtering contacts by person"""
        response = self.client_api.get(f'{self.list_url}?person={self.test_person.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        
    def test_filter_by_type(self):
        """Test filtering contacts by contact type"""
        response = self.client_api.get(f'{self.list_url}?contact_type=PRIMARY')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['contact_type'], 'PRIMARY')
