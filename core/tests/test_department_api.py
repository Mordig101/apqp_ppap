from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from core.models import Department, User # Import the custom User model from core.models

class DepartmentAPITests(APITestCase):
    """
    Tests for the Department API endpoints.
    """

    def setUp(self):
        # Create a test user
        self.user = User.objects.create_user(username='testuser', password='testpassword')
        self.client = APIClient()
        # Authenticate the client
        self.client.login(username='testuser', password='testpassword')

        # Create some initial department data
        self.department1 = Department.objects.create(name='Engineering', description='Handles product design')
        self.department2 = Department.objects.create(name='Quality Assurance', description='Ensures product quality')

        # Define URLs
        self.list_create_url = reverse('department-list') # DefaultRouter generates '-list' for list/create
        self.detail_url = lambda pk: reverse('department-detail', kwargs={'pk': pk}) # DefaultRouter generates '-detail' for retrieve/update/delete

    def test_list_departments(self):
        """
        Ensure we can list departments.
        """
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2) # Assuming pagination is enabled
        self.assertEqual(response.data['results'][0]['name'], self.department1.name)

    def test_create_department(self):
        """
        Ensure we can create a new department.
        """
        data = {'name': 'Manufacturing', 'description': 'Builds the product'}
        response = self.client.post(self.list_create_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Department.objects.count(), 3)
        self.assertEqual(Department.objects.get(id=response.data['id']).name, 'Manufacturing')

    def test_retrieve_department(self):
        """
        Ensure we can retrieve a single department.
        """
        response = self.client.get(self.detail_url(self.department1.pk))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], self.department1.name)

    def test_update_department(self):
        """
        Ensure we can update a department.
        """
        data = {'name': 'Engineering Updated', 'description': 'Handles product design and development'}
        response = self.client.put(self.detail_url(self.department1.pk), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.department1.refresh_from_db()
        self.assertEqual(self.department1.name, 'Engineering Updated')
        self.assertEqual(self.department1.description, 'Handles product design and development')

    def test_partial_update_department(self):
        """
        Ensure we can partially update a department.
        """
        data = {'name': 'Engineering Partially Updated'}
        response = self.client.patch(self.detail_url(self.department1.pk), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.department1.refresh_from_db()
        self.assertEqual(self.department1.name, 'Engineering Partially Updated')
        # Description should remain unchanged
        self.assertEqual(self.department1.description, 'Handles product design')


    def test_delete_department(self):
        """
        Ensure we can delete a department.
        """
        response = self.client.delete(self.detail_url(self.department2.pk))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Department.objects.count(), 1)
        with self.assertRaises(Department.DoesNotExist):
            Department.objects.get(pk=self.department2.pk)

    def test_unauthenticated_access(self):
        """
        Ensure unauthenticated users cannot access the API.
        """
        self.client.logout()
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN) # Or 401 if only BasicAuth was used without login

        response = self.client.post(self.list_create_url, {'name': 'Test'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        response = self.client.get(self.detail_url(self.department1.pk))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
