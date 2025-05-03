from core.models import Department

def initialize_department(name, responsible=None):
    """
    Initialize a new department
    
    Args:
        name (str): Department name
        responsible (Person, optional): Person responsible for the department
        
    Returns:
        Department: The created department
    """
    department = Department.objects.create(
        name=name,
        responsible=responsible
    )
    
    return department
