from core.models import Department, Person, Team
from core.services.history.department import (
    record_department_creation,
    record_department_update,
    record_department_responsible_change,
    record_department_deletion
)

def get_department_by_id(department_id):
    """
    Get department by ID
    
    Args:
        department_id (int): Department ID
        
    Returns:
        Department: The department object
        
    Raises:
        Department.DoesNotExist: If department not found
    """
    return Department.objects.get(id=department_id)

def get_department_by_name(name):
    """
    Get department by name
    
    Args:
        name (str): Department name
        
    Returns:
        Department: The department object or None if not found
    """
    try:
        return Department.objects.get(name=name)
    except Department.DoesNotExist:
        return None

def get_departments_by_responsible(responsible_id):
    """
    Get departments by responsible person
    
    Args:
        responsible_id (int): Responsible person ID
        
    Returns:
        QuerySet: Departments with the given responsible person
    """
    return Department.objects.filter(responsible_id=responsible_id)

def update_department(department, name=None, responsible=None):
    """
    Update department information
    
    Args:
        department: Department object
        name (str): New name (if None, keep existing)
        responsible: New responsible user (if None, keep existing)
    
    Returns:
        Department: The updated department
    """
    updated_fields = []
    
    if name is not None and name != department.name:
        department.name = name
        updated_fields.append('name')
    
    if responsible is not None and responsible != department.responsible:
        old_responsible = department.responsible
        department.responsible = responsible
        updated_fields.append('responsible')
        record_department_responsible_change(department, old_responsible.id if old_responsible else None, responsible.id if responsible else None)
    
    if updated_fields:
        department.save()
        record_department_update(department, updated_fields)
    
    return department

def delete_department(department):
    """
    Delete a department
    
    Args:
        department: Department object
    """
    # Check for persons in this department
    persons_count = Person.objects.filter(department=department).count()
    if persons_count > 0:
        raise ValueError(f"Cannot delete department. It has {persons_count} persons assigned.")
    
    record_department_deletion(department)
    department.delete()

def get_department_members(department_id):
    """
    Get all members of a department
    
    Args:
        department_id (int): Department ID
        
    Returns:
        QuerySet: Persons in the department
    """
    return Person.objects.filter(department_id=department_id)

def get_department_teams(department_id):
    """
    Get all teams in a department
    
    Args:
        department_id (int): Department ID
        
    Returns:
        QuerySet: Teams in the department
    """
    return Team.objects.filter(department_id=department_id)

def update_department_name(department, name):
    """
    Update department name
    
    Args:
        department (Department): Department to update
        name (str): New name
        
    Returns:
        Department: Updated department
    """
    department.name = name
    department.save()
    return department

def update_department_responsible(department, responsible):
    """
    Update department responsible person
    
    Args:
        department (Department): Department to update
        responsible (Person): New responsible person
        
    Returns:
        Department: Updated department
    """
    department.responsible = responsible
    department.save()
    return department

def check_department_dependencies(department):
    """
    Check if department has dependencies
    
    Args:
        department (Department): Department to check
        
    Returns:
        bool: True if department has dependencies, False otherwise
    """
    # Check if department has members
    if Person.objects.filter(department=department).exists():
        return True
    
    # Check if department has teams
    if Team.objects.filter(department=department).exists():
        return True
    
    return False
