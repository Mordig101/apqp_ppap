from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Avg, Q, F, Sum, Case, When, IntegerField
from django.utils import timezone
from datetime import timedelta
from django.db import transaction

from core.services.analyse.api import (
    analyze_deadline_violations,
    analyze_critical_path,
    detect_resource_allocation_problems,
    generate_early_warnings,
    analyze_historical_patterns
)
from core.models import Project, PPAP, Phase, Output, User, Team, Document, History

class AnalyseViewSet(viewsets.ViewSet):
    """
    ViewSet for advanced analysis and reporting
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=True, methods=['get'])
    def project(self, request, pk=None):
        """
        Get advanced analysis for a specific project
        """
        try:
            project = Project.objects.get(id=pk)
            
            # Get PPAP
            ppap = PPAP.objects.filter(project=project).first()
            
            # Get phases
            phases = Phase.objects.filter(ppap=ppap) if ppap else []
            
            # Get outputs
            outputs = Output.objects.filter(phase__in=phases)
            
            # Calculate critical path
            critical_path = self._calculate_critical_path(phases)
            
            # Calculate bottlenecks
            bottlenecks = self._identify_bottlenecks(outputs)
            
            # Calculate risk areas
            risk_areas = self._identify_risk_areas(phases, outputs)
            
            # Calculate efficiency metrics
            efficiency_metrics = self._calculate_efficiency_metrics(project, phases, outputs)
            
            # Calculate quality metrics
            quality_metrics = self._calculate_quality_metrics(outputs)
            
            return Response({
                'project_id': project.id,
                'project_name': project.name,
                'critical_path': critical_path,
                'bottlenecks': bottlenecks,
                'risk_areas': risk_areas,
                'efficiency_metrics': efficiency_metrics,
                'quality_metrics': quality_metrics
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
        Get advanced analysis for a specific phase
        """
        try:
            phase = Phase.objects.get(id=pk)
            
            # Get outputs
            outputs = Output.objects.filter(phase=phase)
            
            # Calculate bottlenecks
            bottlenecks = self._identify_bottlenecks([outputs])
            
            # Calculate risk areas
            risk_areas = self._identify_risk_areas([phase], outputs)
            
            # Calculate efficiency metrics
            efficiency_metrics = self._calculate_phase_efficiency_metrics(phase, outputs)
            
            # Calculate quality metrics
            quality_metrics = self._calculate_quality_metrics(outputs)
            
            return Response({
                'phase_id': phase.id,
                'phase_name': phase.template.name if phase.template else "Unknown",
                'bottlenecks': bottlenecks,
                'risk_areas': risk_areas,
                'efficiency_metrics': efficiency_metrics,
                'quality_metrics': quality_metrics
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
    def team(self, request, pk=None):
        """
        Get advanced analysis for a specific team
        """
        try:
            team = Team.objects.get(id=pk)
            
            # Get projects for this team
            projects = Project.objects.filter(team=team)
            
            # Get team members
            members = team.members.all()
            
            # Calculate workload distribution
            workload_distribution = self._calculate_workload_distribution(members)
            
            # Calculate team performance
            team_performance = self._calculate_team_performance(team, projects)
            
            # Calculate collaboration metrics
            collaboration_metrics = self._calculate_collaboration_metrics(team, members)
            
            return Response({
                'team_id': team.id,
                'team_name': team.name,
                'workload_distribution': workload_distribution,
                'team_performance': team_performance,
                'collaboration_metrics': collaboration_metrics
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
    
    @action(detail=False, methods=['post'])
    def custom_report(self, request):
        """
        Generate a custom report based on specified parameters
        """
        try:
            # Get parameters from request
            start_date = request.data.get('start_date')
            end_date = request.data.get('end_date')
            project_ids = request.data.get('project_ids', [])
            team_ids = request.data.get('team_ids', [])
            user_ids = request.data.get('user_ids', [])
            metrics = request.data.get('metrics', [])
            
            # Validate parameters
            if not start_date or not end_date:
                return Response(
                    {"error": "start_date and end_date are required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Parse dates
            try:
                start_date = timezone.make_aware(timezone.datetime.fromisoformat(start_date.replace('Z', '+00:00')))
                end_date = timezone.make_aware(timezone.datetime.fromisoformat(end_date.replace('Z', '+00:00')))
            except ValueError:
                return Response(
                    {"error": "Invalid date format. Use ISO format (YYYY-MM-DDTHH:MM:SS)"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Build report data
            report_data = {
                'parameters': {
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat(),
                    'project_ids': project_ids,
                    'team_ids': team_ids,
                    'user_ids': user_ids,
                    'metrics': metrics
                },
                'data': {}
            }
            
            # Add requested metrics
            if 'project_progress' in metrics:
                report_data['data']['project_progress'] = self._get_project_progress(project_ids, start_date, end_date)
            
            if 'team_performance' in metrics:
                report_data['data']['team_performance'] = self._get_team_performance(team_ids, start_date, end_date)
            
            if 'user_productivity' in metrics:
                report_data['data']['user_productivity'] = self._get_user_productivity(user_ids, start_date, end_date)
            
            if 'quality_metrics' in metrics:
                report_data['data']['quality_metrics'] = self._get_quality_metrics(project_ids, start_date, end_date)
            
            if 'timeline_adherence' in metrics:
                report_data['data']['timeline_adherence'] = self._get_timeline_adherence(project_ids, start_date, end_date)
            
            return Response(report_data)
            
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    # Helper methods for analysis
    
    def _calculate_critical_path(self, phases):
        """
        Calculate the critical path for a set of phases
        """
        critical_path = []
        
        # Sort phases by order
        sorted_phases = sorted(phases, key=lambda p: p.template.order if p.template else 0)
        
        for phase in sorted_phases:
            # Get phase deadline from history
            history = History.objects.filter(history_id=phase.history_id).order_by('-created_at').first()
            deadline = history.deadline if history else None
            
            # Get outputs for this phase
            outputs = Output.objects.filter(phase=phase)
            
            # Find the output with the latest deadline
            latest_output = None
            latest_deadline = None
            
            for output in outputs:
                output_history = History.objects.filter(history_id=output.history_id).order_by('-created_at').first()
                if output_history and output_history.deadline:
                    if latest_deadline is None or output_history.deadline > latest_deadline:
                        latest_output = output
                        latest_deadline = output_history.deadline
            
            # Add to critical path if this phase has a deadline or critical output
            if deadline or latest_output:
                critical_path.append({
                    'phase_id': phase.id,
                    'phase_name': phase.template.name if phase.template else "Unknown",
                    'deadline': deadline.isoformat() if deadline else None,
                    'critical_output': {
                        'id': latest_output.id,
                        'name': latest_output.template.name if latest_output and latest_output.template else "Unknown",
                        'deadline': latest_deadline.isoformat() if latest_deadline else None
                    } if latest_output else None
                })
        
        return critical_path
    
    def _identify_bottlenecks(self, outputs):
        """
        Identify bottlenecks in the workflow
        """
        bottlenecks = []
        
        # Group outputs by status
        outputs_by_status = {}
        for output in outputs:
            if output.status not in outputs_by_status:
                outputs_by_status[output.status] = []
            outputs_by_status[output.status].append(output)
        
        # Check for bottlenecks in "In Progress" outputs
        in_progress_outputs = outputs_by_status.get('In Progress', [])
        
        for output in in_progress_outputs:
            # Get history for this output
            history = History.objects.filter(history_id=output.history_id).order_by('-created_at').first()
            
            # Check if output has been in progress for a long time
            if history and history.started_at:
                days_in_progress = (timezone.now() - history.started_at).days
                
                if days_in_progress > 14:  # More than 2 weeks in progress
                    bottlenecks.append({
                        'output_id': output.id,
                        'output_name': output.template.name if output.template else "Unknown",
                        'days_in_progress': days_in_progress,
                        'phase_id': output.phase_id,
                        'phase_name': output.phase.template.name if output.phase and output.phase.template else "Unknown",
                        'responsible': output.user.username if output.user else None
                    })
        
        # Check for phases with many outputs in "Not Started" status
        for phase_id in set(output.phase_id for output in outputs):
            phase_outputs = [o for o in outputs if o.phase_id == phase_id]
            not_started_outputs = [o for o in phase_outputs if o.status == 'Not Started']
            
            if len(not_started_outputs) > 5 and len(not_started_outputs) / len(phase_outputs) > 0.7:
                # If more than 70% of outputs are not started, this is a bottleneck
                phase = Phase.objects.get(id=phase_id)
                bottlenecks.append({
                    'phase_id': phase_id,
                    'phase_name': phase.template.name if phase.template else "Unknown",
                    'not_started_outputs': len(not_started_outputs),
                    'total_outputs': len(phase_outputs),
                    'percentage': len(not_started_outputs) / len(phase_outputs) * 100,
                    'responsible': phase.responsible.username if phase.responsible else None
                })
        
        return bottlenecks
    
    def _identify_risk_areas(self, phases, outputs):
        """
        Identify risk areas in the project
        """
        risk_areas = []
        
        # Check for phases close to deadline
        for phase in phases:
            history = History.objects.filter(history_id=phase.history_id).order_by('-created_at').first()
            
            if history and history.deadline:
                days_to_deadline = (history.deadline - timezone.now()).days
                
                if days_to_deadline < 7 and phase.status not in ['Completed', 'Approved']:
                    # Less than a week to deadline and not completed
                    phase_outputs = [o for o in outputs if o.phase_id == phase.id]
                    completed_outputs = [o for o in phase_outputs if o.status in ['Completed', 'Approved']]
                    
                    risk_areas.append({
                        'type': 'deadline_risk',
                        'phase_id': phase.id,
                        'phase_name': phase.template.name if phase.template else "Unknown",
                        'days_to_deadline': days_to_deadline,
                        'completion_percentage': len(completed_outputs) / len(phase_outputs) * 100 if phase_outputs else 0,
                        'responsible': phase.responsible.username if phase.responsible else None
                    })
        
        # Check for outputs with rejected status
        rejected_outputs = [o for o in outputs if o.status == 'Rejected']
        
        for output in rejected_outputs:
            risk_areas.append({
                'type': 'rejected_output',
                'output_id': output.id,
                'output_name': output.template.name if output.template else "Unknown",
                'phase_id': output.phase_id,
                'phase_name': output.phase.template.name if output.phase and output.phase.template else "Unknown",
                'responsible': output.user.username if output.user else None
            })
        
        # Check for phases with no responsible person
        for phase in phases:
            if not phase.responsible and phase.status not in ['Completed', 'Approved']:
                risk_areas.append({
                    'type': 'no_responsible',
                    'phase_id': phase.id,
                    'phase_name': phase.template.name if phase.template else "Unknown",
                    'status': phase.status
                })
        
        return risk_areas
    
    def _calculate_efficiency_metrics(self, project, phases, outputs):
        """
        Calculate efficiency metrics for a project
        """
        # Calculate average time to complete outputs
        completed_outputs = [o for o in outputs if o.status in ['Completed', 'Approved']]
        
        total_completion_time = 0
        outputs_with_time = 0
        
        for output in completed_outputs:
            history = History.objects.filter(history_id=output.history_id).order_by('-created_at').first()
            
            if history and history.started_at and history.completed_at:
                completion_time = (history.completed_at - history.started_at).days
                total_completion_time += completion_time
                outputs_with_time += 1
        
        avg_completion_time = total_completion_time / outputs_with_time if outputs_with_time > 0 else 0
        
        # Calculate phase transition times
        phase_transition_times = []
        
        sorted_phases = sorted(phases, key=lambda p: p.template.order if p.template else 0)
        
        for i in range(1, len(sorted_phases)):
            prev_phase = sorted_phases[i-1]
            curr_phase = sorted_phases[i]
            
            prev_history = History.objects.filter(history_id=prev_phase.history_id).order_by('-created_at').first()
            curr_history = History.objects.filter(history_id=curr_phase.history_id).order_by('-created_at').first()
            
            if prev_history and curr_history and prev_history.completed_at and curr_history.started_at:
                transition_time = (curr_history.started_at - prev_history.completed_at).days
                
                phase_transition_times.append({
                    'from_phase': prev_phase.template.name if prev_phase.template else "Unknown",
                    'to_phase': curr_phase.template.name if curr_phase.template else "Unknown",
                    'transition_time_days': transition_time
                })
        
        # Calculate resource utilization
        from core.models import Todo
        todos = Todo.objects.filter(output__in=outputs)
        
        users_with_todos = set(todo.user_id for todo in todos)
        todos_per_user = {}
        
        for user_id in users_with_todos:
            user_todos = [todo for todo in todos if todo.user_id == user_id]
            todos_per_user[user_id] = len(user_todos)
        
        return {
            'avg_output_completion_time': avg_completion_time,
            'phase_transition_times': phase_transition_times,
            'resource_utilization': {
                'users_count': len(users_with_todos),
                'todos_per_user': todos_per_user
            }
        }
    
    def _calculate_phase_efficiency_metrics(self, phase, outputs):
        """
        Calculate efficiency metrics for a phase
        """
        # Calculate average time to complete outputs
        completed_outputs = [o for o in outputs if o.status in ['Completed', 'Approved']]
        
        total_completion_time = 0
        outputs_with_time = 0
        
        for output in completed_outputs:
            history = History.objects.filter(history_id=output.history_id).order_by('-created_at').first()
            
            if history and history.started_at and history.completed_at:
                completion_time = (history.completed_at - history.started_at).days
                total_completion_time += completion_time
                outputs_with_time += 1
        
        avg_completion_time = total_completion_time / outputs_with_time if outputs_with_time > 0 else 0
        
        # Calculate resource utilization
        from core.models import Todo
        todos = Todo.objects.filter(output__in=outputs)
        
        users_with_todos = set(todo.user_id for todo in todos)
        todos_per_user = {}
        
        for user_id in users_with_todos:
            user_todos = [todo for todo in todos if todo.user_id == user_id]
            todos_per_user[user_id] = len(user_todos)
        
        return {
            'avg_output_completion_time': avg_completion_time,
            'resource_utilization': {
                'users_count': len(users_with_todos),
                'todos_per_user': todos_per_user
            }
        }
    
    def _calculate_quality_metrics(self, outputs):
        """
        Calculate quality metrics for outputs
        """
        total_outputs = len(outputs)
        rejected_outputs = len([o for o in outputs if o.status == 'Rejected'])
        approved_outputs = len([o for o in outputs if o.status == 'Approved'])
        
        rejection_rate = rejected_outputs / total_outputs * 100 if total_outputs > 0 else 0
        approval_rate = approved_outputs / total_outputs * 100 if total_outputs > 0 else 0
        
        # Calculate revision counts
        revision_counts = {}
        
        for output in outputs:
            # Count document versions as revisions
            documents = Document.objects.filter(output=output)
            
            if documents:
                revision_counts[output.id] = {
                    'output_name': output.template.name if output.template else "Unknown",
                    'revisions': documents.count()
                }
        
        return {
            'rejection_rate': rejection_rate,
            'approval_rate': approval_rate,
            'revision_counts': revision_counts
        }
    
    def _calculate_workload_distribution(self, members):
        """
        Calculate workload distribution among team members
        """
        workload_distribution = {}
        
        for member in members:
            user = User.objects.filter(username=member.name).first()
            
            if user:
                from core.models import Todo
                todos = Todo.objects.filter(user=user)
                
                # Count todos by status
                todos_by_status = {}
                for todo in todos:
                    status = todo.output.status
                    if status not in todos_by_status:
                        todos_by_status[status] = 0
                    todos_by_status[status] += 1
                
                workload_distribution[member.id] = {
                    'name': member.name,
                    'total_todos': todos.count(),
                    'todos_by_status': todos_by_status
                }
        
        return workload_distribution
    
    def _calculate_team_performance(self, team, projects):
        """
        Calculate team performance metrics
        """
        # Calculate project completion rate
        total_projects = projects.count()
        completed_projects = projects.filter(status__in=['Completed', 'Archived']).count()
        
        completion_rate = completed_projects / total_projects * 100 if total_projects > 0 else 0
        
        # Calculate on-time delivery rate
        on_time_projects = 0
        
        for project in projects:
            history = History.objects.filter(history_id=project.history_id).order_by('-created_at').first()
            
            if history and history.deadline and history.completed_at:
                if history.completed_at <= history.deadline:
                    on_time_projects += 1
        
        on_time_rate = on_time_projects / completed_projects * 100 if completed_projects > 0 else 0
        
        return {
            'completion_rate': completion_rate,
            'on_time_delivery_rate': on_time_rate,
            'total_projects': total_projects,
            'completed_projects': completed_projects,
            'on_time_projects': on_time_projects
        }
    
    def _calculate_collaboration_metrics(self, team, members):
        """
        Calculate collaboration metrics for a team
        """
        # This is a placeholder for collaboration metrics
        # In a real implementation, this could analyze communication patterns,
        # shared document edits, etc.
        
        return {
            'collaboration_score': 0,  # Placeholder
            'communication_frequency': 0,  # Placeholder
            'shared_outputs': 0  # Placeholder
        }
    
    def _get_project_progress(self, project_ids, start_date, end_date):
        """
        Get project progress data for the specified projects and date range
        """
        projects = Project.objects.filter(id__in=project_ids) if project_ids else Project.objects.all()
        
        progress_data = []
        
        for project in projects:
            # Get PPAP
            ppap = PPAP.objects.filter(project=project).first()
            
            # Get phases
            phases = Phase.objects.filter(ppap=ppap) if ppap else []
            
            # Calculate progress
            total_phases = len(phases)
            completed_phases = sum(1 for phase in phases if phase.status in ['Completed', 'Approved'])
            
            progress_percentage = completed_phases / total_phases * 100 if total_phases > 0 else 0
            
            # Get history events in the date range
            history_events = History.objects.filter(
                Q(table_name='project') & Q(history_id=project.history_id),
                created_at__gte=start_date,
                created_at__lte=end_date
            ).order_by('created_at')
            
            progress_data.append({
                'project_id': project.id,
                'project_name': project.name,
                'progress_percentage': progress_percentage,
                'total_phases': total_phases,
                'completed_phases': completed_phases,
                'history_events': [
                    {
                        'event': event.event,
                        'created_at': event.created_at.isoformat()
                    } for event in history_events
                ]
            })
        
        return progress_data
    
    def _get_team_performance(self, team_ids, start_date, end_date):
        """
        Get team performance data for the specified teams and date range
        """
        teams = Team.objects.filter(id__in=team_ids) if team_ids else Team.objects.all()
        
        performance_data = []
        
        for team in teams:
            # Get projects for this team
            projects = Project.objects.filter(team=team)
            
            # Calculate performance metrics
            team_performance = self._calculate_team_performance(team, projects)
            
            # Get history events in the date range
            project_history_ids = [project.history_id for project in projects]
            
            history_events = History.objects.filter(
                history_id__in=project_history_ids,
                created_at__gte=start_date,
                created_at__lte=end_date
            ).order_by('created_at')
            
            performance_data.append({
                'team_id': team.id,
                'team_name': team.name,
                'performance_metrics': team_performance,
                'history_events': [
                    {
                        'event': event.event,
                        'created_at': event.created_at.isoformat()
                    } for event in history_events
                ]
            })
        
        return performance_data
    
    def _get_user_productivity(self, user_ids, start_date, end_date):
        """
        Get user productivity data for the specified users and date range
        """
        users = User.objects.filter(id__in=user_ids) if user_ids else User.objects.all()
        
        productivity_data = []
        
        for user in users:
            # Get todos for this user
            from core.models import Todo
            todos = Todo.objects.filter(user=user)
            
            # Get outputs assigned to this user
            outputs = Output.objects.filter(id__in=[todo.output_id for todo in todos])
            
            # Calculate productivity metrics
            completed_outputs = [o for o in outputs if o.status in ['Completed', 'Approved']]
            
            # Get history events in the date range
            history_events = History.objects.filter(
                user=user.id,
                created_at__gte=start_date,
                created_at__lte=end_date
            ).order_by('created_at')
            
            productivity_data.append({
                'user_id': user.id,
                'username': user.username,
                'total_outputs': len(outputs),
                'completed_outputs': len(completed_outputs),
                'completion_rate': len(completed_outputs) / len(outputs) * 100 if outputs else 0,
                'history_events': [
                    {
                        'event': event.event,
                        'created_at': event.created_at.isoformat()
                    } for event in history_events
                ]
            })
        
        return productivity_data
    
    def _get_quality_metrics(self, project_ids, start_date, end_date):
        """
        Get quality metrics for the specified projects and date range
        """
        projects = Project.objects.filter(id__in=project_ids) if project_ids else Project.objects.all()
        
        quality_data = []
        
        for project in projects:
            # Get PPAP
            ppap = PPAP.objects.filter(project=project).first()
            
            # Get phases
            phases = Phase.objects.filter(ppap=ppap) if ppap else []
            
            # Get outputs
            outputs = Output.objects.filter(phase__in=phases)
            
            # Calculate quality metrics
            quality_metrics = self._calculate_quality_metrics(outputs)
            
            quality_data.append({
                'project_id': project.id,
                'project_name': project.name,
                'quality_metrics': quality_metrics
            })
        
        return quality_data
    
    def _get_timeline_adherence(self, project_ids, start_date, end_date):
        """
        Get timeline adherence data for the specified projects and date range
        """
        projects = Project.objects.filter(id__in=project_ids) if project_ids else Project.objects.all()
        
        timeline_data = []
        
        for project in projects:
            # Get PPAP
            ppap = PPAP.objects.filter(project=project).first()
            
            # Get phases
            phases = Phase.objects.filter(ppap=ppap) if ppap else []
            
            # Calculate timeline adherence
            phases_with_deadlines = 0
            phases_completed_on_time = 0
            
            for phase in phases:
                history = History.objects.filter(history_id=phase.history_id).order_by('-created_at').first()
                
                if history and history.deadline:
                    phases_with_deadlines += 1
                    
                    if history.completed_at and history.completed_at <= history.deadline:
                        phases_completed_on_time += 1
            
            adherence_rate = phases_completed_on_time / phases_with_deadlines * 100 if phases_with_deadlines > 0 else 0
            
            timeline_data.append({
                'project_id': project.id,
                'project_name': project.name,
                'phases_with_deadlines': phases_with_deadlines,
                'phases_completed_on_time': phases_completed_on_time,
                'adherence_rate': adherence_rate
            })
        
        return timeline_data

    @action(detail=False, methods=['get'])
    def deadline_violations(self, request):
        """Analyze project deadline violations"""
        project_id = request.query_params.get('project_id')
        if not project_id:
            return Response({"error": "project_id parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            results = analyze_deadline_violations(project_id)
            return Response(results)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def critical_path(self, request):
        """Analyze project critical path"""
        project_id = request.query_params.get('project_id')
        if not project_id:
            return Response({"error": "project_id parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            results = analyze_critical_path(project_id)
            return Response(results)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def resource_allocation(self, request):
        """Detect resource allocation problems"""
        project_id = request.query_params.get('project_id')
        if not project_id:
            return Response({"error": "project_id parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            results = detect_resource_allocation_problems(project_id)
            return Response(results)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def early_warnings(self, request):
        """Get early warnings about potential issues"""
        try:
            warnings = generate_early_warnings()
            return Response(warnings)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def historical_patterns(self, request):
        """Analyze historical patterns in project delays"""
        team_id = request.query_params.get('team_id')
        
        try:
            results = analyze_historical_patterns(team_id)
            return Response(results)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
