from core.models import History, Project, PPAP, Phase, Output, Document, Team, Person, User
import json

def process_history_records(history_records):
    """Helper function to process history records and parse event JSON"""
    processed_records = []
    
    for record in history_records:
        # Create a mutable copy of the record
        processed_record = dict(record)
        
        # Try to parse the event field as JSON
        if 'event' in processed_record and processed_record['event']:
            try:
                # Parse the JSON string into a Python object
                event_data = json.loads(processed_record['event'])
                
                # If it's already a list of events, use it
                if isinstance(event_data, list):
                    processed_record['events'] = event_data
                else:
                    # If it's not a list, create a single event entry
                    processed_record['events'] = [{
                        "type": processed_record.get('table_name', 'action'),
                        "details": str(processed_record['event']),
                        "timestamp": processed_record.get('created_at')
                    }]
            except (json.JSONDecodeError, TypeError):
                # If not valid JSON, create a single event entry
                processed_record['events'] = [{
                    "type": processed_record.get('table_name', 'action'),
                    "details": str(processed_record['event']),
                    "timestamp": processed_record.get('created_at')
                }]
        else:
            # If no event field, create a placeholder event
            processed_record['events'] = [{
                "type": processed_record.get('table_name', 'action'),
                "details": "No details available",
                "timestamp": processed_record.get('created_at')
            }]
        
        # Remove the original event field to avoid confusion
        if 'event' in processed_record:
            del processed_record['event']
        
        processed_records.append(processed_record)
    
    return processed_records

def get_nested_project_history(project_id):
    """
    Retrieves hierarchical history for a project including:
    - Project history
    - PPAP history
        - Phase history
            - Output history
                - Document history
    - Team history
        - Person history
    - User history
    
    Returns a structured dictionary of history entries
    """
    try:
        project = Project.objects.get(id=project_id)
    except Project.DoesNotExist:
        return {"error": f"Project with ID {project_id} not found"}
    
    # Get direct project history
    raw_project_history = list(History.objects.filter(id__startswith=project.history_id).values())
    project_history = process_history_records(raw_project_history)
    
    # Initialize nested structure
    nested_history = {
        "project": project_history,
        "ppap": {"history": [], "phases": {}},
        "team": {"history": [], "persons": {}},
        "users": []
    }
    
    # Get PPAP history if exists
    if hasattr(project, 'ppap') and project.ppap:
        raw_ppap_history = list(History.objects.filter(id__startswith=project.ppap.history_id).values())
        ppap_history = process_history_records(raw_ppap_history)
        nested_history["ppap"]["history"] = ppap_history
        
        # Get related phases
        phases = Phase.objects.filter(ppap_id=project.ppap.id).select_related('template')
        for phase in phases:
            raw_phase_history = list(History.objects.filter(id__startswith=phase.history_id).values())
            phase_history = process_history_records(raw_phase_history)
            
            nested_history["ppap"]["phases"][phase.id] = {
                "name": phase.template.name,  # Use phase.template.name
                "history": phase_history,
                "outputs": {}
            }
            
            # Get related outputs
            outputs = Output.objects.filter(phase_id=phase.id).select_related('template')
            for output in outputs:
                raw_output_history = list(History.objects.filter(id__startswith=output.history_id).values())
                output_history = process_history_records(raw_output_history)
                
                nested_history["ppap"]["phases"][phase.id]["outputs"][output.id] = {
                    "name": output.template.name,  # Use output.template.name 
                    "history": output_history,
                    "documents": {}
                }
                
                # Get related documents
                documents = Document.objects.filter(output_id=output.id)
                for doc in documents:
                    raw_doc_history = list(History.objects.filter(id__startswith=doc.history_id).values())
                    doc_history = process_history_records(raw_doc_history)
                    
                    # Make sure to use the appropriate field for document name
                    doc_name = doc.name if hasattr(doc, 'name') else (
                        doc.filename if hasattr(doc, 'filename') else f"Document {doc.id}"
                    )
                    
                    nested_history["ppap"]["phases"][phase.id]["outputs"][output.id]["documents"][doc.id] = {
                        "name": doc_name,
                        "history": doc_history
                    }
    
    # Get team history
    team = project.team
    raw_team_history = list(History.objects.filter(id__startswith=team.history_id).values())
    team_history = process_history_records(raw_team_history)
    nested_history["team"]["history"] = team_history
    
    # Get person history for team members
    team_members = Person.objects.filter(teams=team) if team else []
    for member in team_members:
        raw_person_history = list(History.objects.filter(id__startswith=member.history_id).values())
        person_history = process_history_records(raw_person_history)
        
        nested_history["team"]["persons"][member.id] = {
            "name": f"{member.first_name} {member.last_name}",
            "history": person_history
        }
    
    # Get user history for team members who are users
    users = User.objects.filter(person__in=team_members)
    for user in users:
        raw_user_history = list(History.objects.filter(id__startswith=user.person.history_id).values())
        user_history = process_history_records(raw_user_history)
        
        nested_history["users"].append({
            "id": user.id,
            "username": user.username,
            "history": user_history
        })
    
    return nested_history