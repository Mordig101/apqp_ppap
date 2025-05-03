from core.models import Department, Person
from core.services.department.initialization import initialize_department
from core.services.department.functions import (
    get_department_by_id,
    update_department_name,
    update_department_responsible,
    check_department_dependencies,
    get_department_members,
    get_department_teams
)

def update_department(department, name=None, responsible=None):
    """
    Update department
    
    Args:
        department (Department): Department to update
        name (str, optional): New name
        responsible (Person, optional): New responsible person
        
    Returns:
        Department: Updated department
    """
    if name is not None:
        update_department_name(department, name)
    
    if responsible is not None:
        update_department_responsible(department, responsible)
    
    return department

def delete_department(department):
    """
    Delete department
    
    Args:
        department (Department): Department to delete
        
    Raises:
        ValueError: If department has dependencies
    """
    if check_department_dependencies(department):
        raise ValueError("Cannot delete department with dependencies")
    
    department.delete()
