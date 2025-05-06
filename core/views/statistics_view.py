from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Avg, Q, F
from django.utils import timezone
from datetime import timedelta

from core.models import Project, PPAP, Phase, Output, User, Team, Document, History

class StatisticsViewSet(viewsets.ViewSet):
    """
    ViewSet for statistics and analytics
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=True, methods=['get'])
    def project(self, request, pk=None):
        """
        Get statistics for a specific project
        """
        try:
            project = Project.objects.get(id=pk)
            
            # Get PPAP
            ppap = PPAP.objects.filter(project=project).first()
            
            # Get phases
            phases = Phase.objects.filter(ppap=ppap) if ppap else []
            
            # Get outputs
            outputs = Output.objects.filter(phase__in=phases)
            
            # Calculate statistics
            total_phases = len(phases)
            completed_phases = sum(1 for phase in phases if phase.status in ['Completed', 'Approved'])
            
            total_outputs = outputs.count()
            outputs_by_status = outputs.values('status').annotate(count=Count('status'))
            
            # Calculate timeline statistics
            on_time_outputs = 0
            delayed_outputs = 0
            
            for output in outputs:
                history = History.objects.filter(history_id=output.history_id).order_by('-created_at').first()
                if history and history.deadline and history.completed_at:
                    if history.completed_at <= history.deadline:
                        on_time_outputs += 1
                    else:
                        delayed_outputs += 1
            
            # Calculate document statistics
            documents = Document.objects.filter(output__in=outputs)
            documents_count = documents.count()
            documents_by_type = documents.values('file_type').annotate(count=Count('file_type'))
            
            # Calculate user activity
            user_activity = History.objects.filter(
                Q(table_name='output') & Q(history_id__in=[o.history_id for o in outputs])
            ).values('user').annotate(count=Count('user'))
            
            return Response({
                'project_id': project.id,
                'project_name': project.name,
                'ppap_level': ppap.level if ppap else None,
                'phases': {
                    'total': total_phases,
                    'completed': completed_phases,
                    'completion_rate': (completed_phases / total_phases * 100) if total_phases > 0 else 0
                },
                'outputs': {
                    'total': total_outputs,
                    'by_status': outputs_by_status,
                    'on_time': on_time_outputs,
                    'delayed': delayed_outputs,
                    'on_time_rate': (on_time_outputs / total_outputs * 100) if total_outputs > 0 else 0
                },
                'documents': {
                    'total': documents_count,
                    'by_type': documents_by_type
                },
                'user_activity': user_activity
            })
            
        except Project.DoesNotExist:
            return Response(
                {"error": f"Project with ID {pk} not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def phase(self, request, pk=None):
        """
        Get statistics for a specific phase
        """
        try:
            phase = Phase.objects.get(id=pk)
            
            # Get outputs
            outputs = Output.objects.filter(phase=phase)
            
            # Calculate statistics
            total_outputs = outputs.count()
            outputs_by_status = outputs.values('status').annotate(count=Count('status'))
            
            # Calculate timeline statistics
            on_time_outputs = 0
            delayed_outputs = 0
            
            for output in outputs:
                history = History.objects.filter(history_id=output.history_id).order_by('-created_at').first()
                if history and history.deadline and history.completed_at:
                    if history.completed_at <= history.deadline:
                        on_time_outputs += 1
                    else:
                        delayed_outputs += 1
            
            # Calculate document statistics
            documents = Document.objects.filter(output__in=outputs)
            documents_count = documents.count()
            
            # Calculate user activity
            user_activity = History.objects.filter(
                Q(table_name='output') & Q(history_id__in=[o.history_id for o in outputs])
            ).values('user').annotate(count=Count('user'))
            
            return Response({
                'phase_id': phase.id,
                'phase_name': phase.template.name if phase.template else "Unknown",
                'status': phase.status,
                'outputs': {
                    'total': total_outputs,
                    'by_status': outputs_by_status,
                    'on_time': on_time_outputs,
                    'delayed': delayed_outputs,
                    'on_time_rate': (on_time_outputs / total_outputs * 100) if total_outputs > 0 else 0
                },
                'documents': {
                    'total': documents_count
                },
                'user_activity': user_activity
            })
            
        except Phase.DoesNotExist:
            return Response(
                {"error": f"Phase with ID {pk} not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def user(self, request, pk=None):
        """
        Get statistics for a specific user
        """
        try:
            user = User.objects.get(id=pk)
            
            # Get todos for this user
            from core.models import Todo
            todos = Todo.objects.filter(user=user)
            
            # Get outputs assigned to this user
            outputs = Output.objects.filter(id__in=[todo.output_id for todo in todos])
            
            # Calculate statistics
            total_outputs = outputs.count()
            outputs_by_status = outputs.values('status').annotate(count=Count('status'))
            
            # Calculate timeline statistics
            on_time_outputs = 0
            delayed_outputs = 0
            
            for output in outputs:
                history = History.objects.filter(history_id=output.history_id).order_by('-created_at').first()
                if history and history.deadline and history.completed_at:
                    if history.completed_at <= history.deadline:
                        on_time_outputs += 1
                    else:
                        delayed_outputs += 1
            
            # Calculate activity over time
            now = timezone.now()
            last_month = now - timedelta(days=30)
            
            activity = History.objects.filter(
                user=user.id,
                created_at__gte=last_month
            ).extra(
                select={'day': 'date(created_at)'}
            ).values('day').annotate(count=Count('id')).order_by('day')
            
            return Response({
                'user_id': user.id,
                'username': user.username,
                'outputs': {
                    'total': total_outputs,
                    'by_status': outputs_by_status,
                    'on_time': on_time_outputs,
                    'delayed': delayed_outputs,
                    'on_time_rate': (on_time_outputs / total_outputs * 100) if total_outputs > 0 else 0
                },
                'todos': {
                    'total': todos.count(),
                    'completed': todos.filter(output__status__in=['Completed', 'Approved']).count()
                },
                'activity': activity
            })
            
        except User.DoesNotExist:
            return Response(
                {"error": f"User with ID {pk} not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def team(self, request, pk=None):
        """
        Get statistics for a specific team
        """
        try:
            team = Team.objects.get(id=pk)
            
            # Get projects for this team
            projects = Project.objects.filter(team=team)
            
            # Get team members
            members = team.members.all()
            
            # Calculate project statistics
            total_projects = projects.count()
            projects_by_status = projects.values('status').annotate(count=Count('status'))
            
            # Calculate member activity
            member_activity = {}
            for member in members:
                user = User.objects.filter(username=member.name).first()
                if user:
                    activity_count = History.objects.filter(user=user.id).count()
                    member_activity[member.id] = {
                        'name': member.name,
                        'activity_count': activity_count
                    }
            
            return Response({
                'team_id': team.id,
                'team_name': team.name,
                'members_count': members.count(),
                'projects': {
                    'total': total_projects,
                    'by_status': projects_by_status
                },
                'member_activity': member_activity
            })
            
        except Team.DoesNotExist:
            return Response(
                {"error": f"Team with ID {pk} not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def overview(self, request):
        """
        Get overall statistics for the system
        """
        try:
            # Count entities
            projects_count = Project.objects.count()
            ppaps_count = PPAP.objects.count()
            phases_count = Phase.objects.count()
            outputs_count = Output.objects.count()
            users_count = User.objects.count()
            
            # Projects by status
            projects_by_status = Project.objects.values('status').annotate(count=Count('status'))
            
            # PPAPs by level
            ppaps_by_level = PPAP.objects.values('level').annotate(count=Count('level'))
            
            # Phases by status
            phases_by_status = Phase.objects.values('status').annotate(count=Count('status'))
            
            # Outputs by status
            outputs_by_status = Output.objects.values('status').annotate(count=Count('status'))
            
            # Recent activity
            now = timezone.now()
            last_week = now - timedelta(days=7)
            
            recent_activity = History.objects.filter(
                created_at__gte=last_week
            ).order_by('-created_at')[:10]
            
            recent_activity_data = []
            for activity in recent_activity:
                recent_activity_data.append({
                    'id': activity.id,
                    'title': activity.title,
                    'event': activity.event,
                    'table_name': activity.table_name,
                    'created_at': activity.created_at.isoformat(),
                    'user': activity.user
                })
            
            return Response({
                'counts': {
                    'projects': projects_count,
                    'ppaps': ppaps_count,
                    'phases': phases_count,
                    'outputs': outputs_count,
                    'users': users_count
                },
                'projects_by_status': projects_by_status,
                'ppaps_by_level': ppaps_by_level,
                'phases_by_status': phases_by_status,
                'outputs_by_status': outputs_by_status,
                'recent_activity': recent_activity_data
            })
            
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
