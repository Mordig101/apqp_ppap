from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from core.models import Person
from core.serializers.person_serializer import PersonSerializer

class PersonViewSet(viewsets.ModelViewSet):
    queryset = Person.objects.all()
    serializer_class = PersonSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['department', 'is_user', 'team']
    search_fields = ['first_name', 'last_name', 'contact_id']
    ordering_fields = ['first_name', 'last_name', 'id']
    ordering = ['last_name', 'first_name']  # default ordering
