from rest_framework import serializers
from core.models import Client
from core.serializers.contact_serializer import ContactSerializer

class ClientSerializer(serializers.ModelSerializer):
    contact = ContactSerializer(read_only=True)
    
    class Meta:
        model = Client
        fields = '__all__'
