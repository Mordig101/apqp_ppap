from core.models import Client  # Import the Client model

def save(self, *args, **kwargs):
    # Prepare for a new record
    create_new = self.id is None
    
    # For new records, set a temporary unique values before first save
    if create_new:
        # Generate a temporary unique ID to avoid constraint violation
        import uuid
        temp_uuid = uuid.uuid4().hex
        
        # Set temporary unique values for constrained fields
        if not self.contact_id:
            self.contact_id = f"temp_{temp_uuid}"
        if not self.history_id:
            self.history_id = f"temp_{temp_uuid}"
        
        # First save to get an ID
        super().save(*args, **kwargs)
        
        # Now set the real IDs based on the client ID
        new_contact_id = f"{self.id}client"
        new_history_id = f"{self.id}client"
        
        # Use update to avoid another save() call
        Client.objects.filter(id=self.id).update(
            contact_id=new_contact_id,
            history_id=new_history_id
        )
        
        # Update the instance attributes to match the database
        self.contact_id = new_contact_id
        self.history_id = new_history_id
    else:
        # For existing records, save normally
        super().save(*args, **kwargs)