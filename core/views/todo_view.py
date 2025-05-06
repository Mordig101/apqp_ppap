from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction
from core.models import Todo, Person, Output, Permission
from django.contrib.auth.models import User
from core.serializers.todo_serializer import TodoSerializer
from core.services.todo.api import (
    initialize_todo,
    update_todo,
    delete_todo,
    get_todos_by_person,
    get_todos_by_output,
    get_todos_by_status,
    change_todo_status,
    reassign_todo,
    create_todo,
    get_user_todos,
    get_pending_todos,
    assign_todos_for_phase
)

class TodoViewSet(viewsets.ModelViewSet):
    queryset = Todo.objects.all()
    serializer_class = TodoSerializer
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        # Extract todo data
        title = request.data.get('title')
        description = request.data.get('description', '')
        assigned_to_id = request.data.get('assigned_to_id')
        output_id = request.data.get('output_id')
        priority = request.data.get('priority', 'medium')
        
        # Validate required fields
        if not all([title, assigned_to_id]):
            return Response(
                {"error": "Missing required fields: title, assigned_to_id"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Get assigned person
            assigned_to = Person.objects.get(id=assigned_to_id)
            
            # Get output if provided
            output = None
            if output_id:
                try:
                    output = Output.objects.get(id=output_id)
                except Output.DoesNotExist:
                    return Response(
                        {"error": f"Output with ID {output_id} not found"},
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            # Create todo
            todo = initialize_todo(
                title=title,
                description=description,
                assigned_to=assigned_to,
                output=output,
                priority=priority
            )
            
            serializer = self.get_serializer(todo)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Person.DoesNotExist:
            return Response(
                {"error": f"Person with ID {assigned_to_id} not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @transaction.atomic
    def update(self, request, *args, **kwargs):
        todo = self.get_object()
        
        # Extract todo data
        title = request.data.get('title')
        description = request.data.get('description')
        priority = request.data.get('priority')
        
        try:
            # Update todo
            updated_todo = update_todo(
                todo=todo,
                title=title,
                description=description,
                priority=priority
            )
            
            serializer = self.get_serializer(updated_todo)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
        todo = self.get_object()
        status_value = request.data.get('status')
        
        if not status_value:
            return Response(
                {"error": "Missing required field: status"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        valid_statuses = ['pending', 'in_progress', 'completed', 'cancelled']
        if status_value not in valid_statuses:
            return Response(
                {"error": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            updated_todo = change_todo_status(todo, status_value)
            serializer = self.get_serializer(updated_todo)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def reassign(self, request, pk=None):
        todo = self.get_object()
        person_id = request.data.get('person_id')
        
        if not person_id:
            return Response(
                {"error": "Missing required field: person_id"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            person = Person.objects.get(id=person_id)
            updated_todo = reassign_todo(todo, person)
            serializer = self.get_serializer(updated_todo)
            return Response(serializer.data)
        except Person.DoesNotExist:
            return Response(
                {"error": f"Person with ID {person_id} not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def by_person(self, request):
        person_id = request.query_params.get('person_id')
        
        if not person_id:
            return Response(
                {"error": "Missing required parameter: person_id"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            todos = get_todos_by_person(person_id)
            serializer = self.get_serializer(todos, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def by_output(self, request):
        output_id = request.query_params.get('output_id')
        
        if not output_id:
            return Response(
                {"error": "Missing required parameter: output_id"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            todos = get_todos_by_output(output_id)
            serializer = self.get_serializer(todos, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def by_status(self, request):
        status_value = request.query_params.get('status')
        
        if not status_value:
            return Response(
                {"error": "Missing required parameter: status"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            todos = get_todos_by_status(status_value)
            serializer = self.get_serializer(todos, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    def list(self, request):
        """
        Get all todos or filter by user
        """
        user_id = request.query_params.get('user_id')
        status_filter = request.query_params.get('status')
        
        if user_id:
            todos = Todo.objects.filter(user_id=user_id)
            
            if status_filter:
                todos = todos.filter(output__status=status_filter)
                
            serializer = self.get_serializer(todos, many=True)
            return Response(serializer.data)
        
        # Default to all todos
        serializer = self.get_serializer(self.queryset, many=True)
        return Response(serializer.data)
    
    @transaction.atomic
    def create(self, request):
        """
        Create a new todo
        """
        user_id = request.data.get('user_id')
        output_id = request.data.get('output_id')
        permission_name = request.data.get('permission_name', 'r')  # Default to read permission
        
        if not all([user_id, output_id]):
            return Response(
                {"error": "Missing required fields: user_id, output_id"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            todo = create_todo(user_id, output_id, permission_name)
            serializer = self.get_serializer(todo)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except User.DoesNotExist:
            return Response(
                {"error": f"User with ID {user_id} not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Output.DoesNotExist:
            return Response(
                {"error": f"Output with ID {output_id} not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Permission.DoesNotExist:
            return Response(
                {"error": f"Permission with name {permission_name} not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def user_todos(self, request):
        """
        Get todos for a specific user
        """
        user_id = request.query_params.get('user_id')
        
        if not user_id:
            return Response(
                {"error": "Missing required parameter: user_id"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            todos = get_user_todos(user_id)
            return Response(todos)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def pending_todos(self, request):
        """
        Get pending todos for a specific user
        """
        user_id = request.query_params.get('user_id')
        
        if not user_id:
            return Response(
                {"error": "Missing required parameter: user_id"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            todos = get_pending_todos(user_id)
            return Response(todos)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """
        Create multiple todos at once
        """
        todos_data = request.data.get('todos', [])
        
        if not todos_data:
            return Response(
                {"error": "No todos provided"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        created_todos = []
        errors = []
        
        for todo_data in todos_data:
            user_id = todo_data.get('user_id')
            output_id = todo_data.get('output_id')
            permission_name = todo_data.get('permission_name', 'r')
            
            if not all([user_id, output_id]):
                errors.append({
                    "data": todo_data,
                    "error": "Missing required fields: user_id, output_id"
                })
                continue
            
            try:
                todo = create_todo(user_id, output_id, permission_name)
                created_todos.append(self.get_serializer(todo).data)
            except Exception as e:
                errors.append({
                    "data": todo_data,
                    "error": str(e)
                })
        
        return Response({
            "created": created_todos,
            "errors": errors,
            "success_count": len(created_todos),
            "error_count": len(errors)
        })        
