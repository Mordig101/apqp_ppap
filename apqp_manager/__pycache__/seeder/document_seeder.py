"""
Seeder for Document model
"""
import os
import django
import uuid
from faker import Faker

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'apqp_manager.settings')
django.setup()

from django.db import transaction
from core.models import Document, Output, User

fake = Faker()

@transaction.atomic
def seed_documents():
    """Seed document data"""
    print("Seeding documents...")
    
    # Clear existing data
    Document.objects.all().delete()
    
    # Get outputs and users
    outputs = Output.objects.filter(status__in=['In Progress', 'Completed'])
    users = User.objects.all()
    
    if not outputs or not users:
        print("Error: Outputs and Users must be seeded first")
        return
    
    # Create documents for each output
    documents = []
    
    for output in outputs:
        # Create 1-3 documents per output
        num_documents = fake.random_int(min=1, max=3)
        
        for i in range(num_documents):
            history_id = f"{uuid.uuid4().hex}document"
            
            # Determine document status based on output status
            if output.status == 'Completed':
                doc_status = fake.random_element(['Approved', 'Draft'])
            else:
                doc_status = 'Draft'
            
            # Generate random file details
            file_types = ['pdf', 'docx', 'xlsx', 'pptx', 'jpg']
            file_type = fake.random_element(file_types)
            file_name = f"{fake.word()}_{fake.random_int(min=1000, max=9999)}.{file_type}"
            file_path = f"documents/{file_name}"
            file_size = fake.random_int(min=10000, max=5000000)  # 10KB to 5MB
            
            # Assign a random uploader
            uploader = fake.random_element(users)
            
            document_data = {
                'name': f"{output.template.name} - {fake.word().capitalize()}",
                'description': fake.paragraph(),
                'file_path': file_path,
                'file_type': file_type,
                'file_size': file_size,
                'uploader': uploader,
                'output': output,
                'version': f"{fake.random_int(min=1, max=5)}.{fake.random_int(min=0, max=9)}",
                'status': doc_status,
                'history_id': history_id
            }
            
            documents.append(Document.objects.create(**document_data))
    
    print(f"Created {len(documents)} documents")
    return documents

if __name__ == "__main__":
    seed_documents()
