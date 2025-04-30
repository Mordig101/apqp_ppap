# Department history tracking
from core.models import History, Department
from core.services.history.initialization import initialize_history

def record_department_creation(department):
    """
    Record department creation in history
    """
    initialize_history(
        title=department.name,
        event=f"Department created with ID {department.id}",
        table_name='department',
        history_id=department.history_id
    )

def record_department_update(department, updated_fields):
    """
    Record department update in history
    """
    initialize_history(
        title=department.name,
        event=f"Department updated: {', '.join(updated_fields)}",
        table_name='department',
        history_id=department.history_id
    )

def record_department_responsible_change(department, old_responsible_id, new_responsible_id):
    """
    Record department responsible change in history
    """
    old_responsible = "None" if not old_responsible_id else f"User {old_responsible_id}"
    new_responsible = "None" if not new_responsible_id else f"User {new_responsible_id}"
    
    initialize_history(
        title=department.name,
        event=f"Department responsible changed from {old_responsible} to {new_responsible}",
        table_name='department',
        history_id=department.history_id
    )

def record_department_deletion(department):
    """
    Record department deletion in history
    """
    initialize_history(
        title=department.name,
        event=f"Department deleted with ID {department.id}",
        table_name='department',
        history_id=department.history_id
    )

def get_department_history(department_id):
    """
    Get complete history for a department
    """
    department = Department.objects.get(id=department_id)
    history_records = History.objects.filter(id=department.history_id).order_by('-created_at')
    return history_records
