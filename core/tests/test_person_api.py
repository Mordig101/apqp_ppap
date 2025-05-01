from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from core.models import Person, Department
from core.serializers.person_serializer import PersonSerializer

class PersonAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.department = Department.objects.create(name="Test Department")
        self.person_data = {
            'first_name': 'John',
            'last_name': 'Doe',
            'department': self.department.id,
            'is_user': False,
            'team': None
        }
        self.person = Person.objects.create(**self.person_data)
        self.list_url = reverse('person-list')
        self.detail_url = reverse('person-detail', kwargs={'pk': self.person.id})

    def test_create_person(self):
        new_person_data = {
            'first_name': 'Jane',
            'last_name': 'Smith',
            'department': self.department.id,
            'is_user': True
        }
        response = self.client.post(self.list_url, new_person_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Person.objects.count(), 2)
        self.assertEqual(Person.objects.get(first_name='Jane').last_name, 'Smith')

    def test_list_persons(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        persons = Person.objects.all()
        serializer = PersonSerializer(persons, many=True)
        self.assertEqual(response.data['results'], serializer.data)

    def test_retrieve_person(self):
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        serializer = PersonSerializer(self.person)
        self.assertEqual(response.data, serializer.data)

    def test_update_person(self):
        update_data = {
            'first_name': 'Johnny',
            'last_name': 'Doe',
            'department': self.department.id,
            'is_user': True
        }
        response = self.client.put(self.detail_url, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.person.refresh_from_db()
        self.assertEqual(self.person.first_name, 'Johnny')
        self.assertEqual(self.person.is_user, True)

    def test_delete_person(self):
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Person.objects.count(), 0)

    def test_filter_by_department(self):
        response = self.client.get(f'{self.list_url}?department={self.department.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['first_name'], 'John')

    def test_filter_by_is_user(self):
        response = self.client.get(f'{self.list_url}?is_user=false')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['is_user'], False)

    def test_search_by_name(self):
        response = self.client.get(f'{self.list_url}?search=John')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['first_name'], 'John')
