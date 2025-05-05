from core.models import Project, PPAP, Phase, Output, Document, User, Person, Team, Client
from django.db.models import Avg, Count, Sum, F, ExpressionWrapper, fields, Q
from django.db.models.functions import TruncMonth, TruncWeek
from django.utils import timezone
import datetime

def get_project_completion_stats():
    """
    Get statistics on project completion rates
    
    Returns:
        dict: Project completion statistics
    """
    total_projects = Project.objects.count()
    completed_projects = Project.objects.filter(status='completed').count()
    in_progress_projects = Project.objects.filter(status='in_progress').count()
    delayed_projects = Project.objects.filter(target_end_date__lt=timezone.now()).exclude(status='completed').count()
    
    # Calculate average completion time for completed projects
    completed_projects_with_dates = Project.objects.filter(
        status='completed',
        start_date__isnull=False,
        completion_date__isnull=False
    )
    
    if completed_projects_with_dates.exists():
        avg_days = completed_projects_with_dates.annotate(
            days=ExpressionWrapper(
                F('completion_date') - F('start_date'),
                output_field=fields.DurationField()
            )
        ).aggregate(avg_days=Avg('days'))['avg_days']
        
        # Convert to days if not None
        avg_completion_days = avg_days.days if avg_days else 0
    else:
        avg_completion_days = 0
    
    return {
        'total_projects': total_projects,
        'completed_projects': completed_projects,
        'completion_rate': round((completed_projects / total_projects * 100), 2) if total_projects else 0,
        'in_progress_projects': in_progress_projects,
        'delayed_projects': delayed_projects,
        'avg_completion_days': avg_completion_days,
    }

def get_ppap_level_distribution():
    """
    Get distribution of PPAP levels
    
    Returns:
        dict: PPAP level distribution statistics
    """
    total_ppaps = PPAP.objects.count()
    level_counts = PPAP.objects.values('level').annotate(count=Count('id'))
    
    distribution = {}
    for level_data in level_counts:
        level = level_data['level']
        count = level_data['count']
        percentage = round((count / total_ppaps * 100), 2) if total_ppaps else 0
        distribution[f"level_{level}"] = {
            'count': count,
            'percentage': percentage
        }
    
    return {
        'total_ppaps': total_ppaps,
        'distribution': distribution
    }

def get_output_completion_rates():
    """
    Get completion rates for outputs by phase type
    
    Returns:
        dict: Output completion statistics by phase
    """
    # Get all phases grouped by template name
    phase_stats = Phase.objects.values('template__name').annotate(
        total_outputs=Count('outputs'),
        completed_outputs=Count('outputs', filter=Q(outputs__status='completed')),
        in_progress_outputs=Count('outputs', filter=Q(outputs__status='in_progress')),
        pending_outputs=Count('outputs', filter=Q(outputs__status='pending'))
    )
    
    results = {}
    for phase in phase_stats:
        phase_name = phase['template__name']
        total = phase['total_outputs']
        completed = phase['completed_outputs']
        
        results[phase_name] = {
            'total_outputs': total,
            'completed_outputs': completed,
            'completion_rate': round((completed / total * 100), 2) if total else 0,
            'in_progress_outputs': phase['in_progress_outputs'],
            'pending_outputs': phase['pending_outputs']
        }
    
    return results

def get_bottleneck_phases():
    """
    Identify bottleneck phases that take the longest to complete
    
    Returns:
        list: Phases that are taking longer than average to complete
    """
    # Calculate average time spent in each phase type
    phase_durations = Phase.objects.filter(
        start_date__isnull=False, 
        completion_date__isnull=False
    ).values('template__name').annotate(
        avg_duration=Avg(
            ExpressionWrapper(
                F('completion_date') - F('start_date'),
                output_field=fields.DurationField()
            )
        )
    )
    
    # Calculate overall average duration
    all_phases_avg = Phase.objects.filter(
        start_date__isnull=False,
        completion_date__isnull=False
    ).annotate(
        duration=ExpressionWrapper(
            F('completion_date') - F('start_date'),
            output_field=fields.DurationField()
        )
    ).aggregate(avg_duration=Avg('duration'))['avg_duration']
    
    # Identify bottlenecks (phases that take longer than average)
    bottlenecks = []
    if all_phases_avg:
        for phase in phase_durations:
            if phase['avg_duration'] > all_phases_avg:
                bottlenecks.append({
                    'phase': phase['template__name'],
                    'avg_duration_days': phase['avg_duration'].days,
                    'overall_avg_days': all_phases_avg.days,
                    'difference_percentage': round(
                        ((phase['avg_duration'].total_seconds() - all_phases_avg.total_seconds()) 
                         / all_phases_avg.total_seconds() * 100), 2
                    )
                })
    
    # Sort by most problematic first
    return sorted(bottlenecks, key=lambda x: x['difference_percentage'], reverse=True)

def get_team_performance_metrics():
    """
    Get performance metrics by team
    
    Returns:
        list: Team performance statistics
    """
    # Get teams with their associated projects
    team_metrics = Team.objects.annotate(
        project_count=Count('projects'),
        completed_projects=Count('projects', filter=Q(projects__status='completed')),
        delayed_projects=Count('projects', filter=Q(
            projects__target_end_date__lt=timezone.now(),
            projects__status__in=['planning', 'in_progress']
        ))
    )
    
    results = []
    for team in team_metrics:
        total_projects = team.project_count
        completed = team.completed_projects
        
        results.append({
            'team_id': team.id,
            'team_name': team.name,
            'project_count': total_projects,
            'completed_projects': completed,
            'completion_rate': round((completed / total_projects * 100), 2) if total_projects else 0,
            'delayed_projects': team.delayed_projects,
            'delay_rate': round((team.delayed_projects / total_projects * 100), 2) if total_projects else 0
        })
    
    # Sort by completion rate (highest first)
    return sorted(results, key=lambda x: x['completion_rate'], reverse=True)

def get_document_submission_trends():
    """
    Get trends in document submissions over time
    
    Returns:
        dict: Document submission trends by month
    """
    # Get document creation counts by month for the past year
    end_date = timezone.now()
    start_date = end_date - datetime.timedelta(days=365)
    
    monthly_trends = Document.objects.filter(
        created_at__range=(start_date, end_date)
    ).annotate(
        month=TruncMonth('created_at')
    ).values('month').annotate(
        count=Count('id')
    ).order_by('month')
    
    results = {
        'by_month': [
            {
                'month': item['month'].strftime('%Y-%m'),
                'document_count': item['count']
            } for item in monthly_trends
        ],
        'total_documents': Document.objects.count(),
        'documents_last_30_days': Document.objects.filter(
            created_at__gte=timezone.now() - datetime.timedelta(days=30)
        ).count(),
        'documents_last_7_days': Document.objects.filter(
            created_at__gte=timezone.now() - datetime.timedelta(days=7)
        ).count(),
    }
    
    return results

def get_resource_allocation_suggestions():
    """
    Get suggestions for resource allocation based on workload
    
    Returns:
        dict: Resource allocation suggestions
    """
    # Calculate average outputs per person
    persons = Person.objects.annotate(
        assigned_outputs=Count('outputs')
    )
    
    avg_outputs_per_person = persons.aggregate(avg=Avg('assigned_outputs'))['avg'] or 0
    
    # Find overloaded and underutilized resources
    overloaded = []
    underutilized = []
    
    threshold_high = avg_outputs_per_person * 1.5  # 50% more than average
    threshold_low = avg_outputs_per_person * 0.5   # 50% less than average
    
    for person in persons:
        if person.assigned_outputs > threshold_high:
            overloaded.append({
                'person_id': person.id,
                'name': f"{person.first_name} {person.last_name}",
                'assigned_outputs': person.assigned_outputs,
                'vs_average': round((person.assigned_outputs / avg_outputs_per_person), 2)
            })
        elif person.assigned_outputs < threshold_low and person.assigned_outputs > 0:
            underutilized.append({
                'person_id': person.id,
                'name': f"{person.first_name} {person.last_name}",
                'assigned_outputs': person.assigned_outputs,
                'vs_average': round((person.assigned_outputs / avg_outputs_per_person), 2)
            })
    
    # Sort lists
    overloaded = sorted(overloaded, key=lambda x: x['assigned_outputs'], reverse=True)
    underutilized = sorted(underutilized, key=lambda x: x['assigned_outputs'])
    
    return {
        'avg_outputs_per_person': round(avg_outputs_per_person, 2),
        'overloaded_resources': overloaded,
        'underutilized_resources': underutilized,
        'suggestions': [
            f"Reassign tasks from {o['name']} ({o['assigned_outputs']} tasks) to {u['name']} ({u['assigned_outputs']} tasks)"
            for o, u in zip(overloaded[:5], underutilized[:5]) if overloaded and underutilized
        ]
    }

def get_quality_metrics():
    """
    Get quality metrics based on document revisions and output reviews
    
    Returns:
        dict: Quality metrics and trends
    """
    # Count outputs that required multiple reviews
    outputs_with_multiple_reviews = Output.objects.annotate(
        review_count=Count('reviews')
    ).filter(review_count__gt=1).count()
    
    total_outputs = Output.objects.count()
    
    # Count documents with multiple versions
    documents_with_revisions = Document.objects.annotate(
        version_count=Count('versions')
    ).filter(version_count__gt=1).count()
    
    total_documents = Document.objects.count()
    
    return {
        'outputs_with_multiple_reviews': outputs_with_multiple_reviews,
        'outputs_review_percentage': round((outputs_with_multiple_reviews / total_outputs * 100), 2) if total_outputs else 0,
        'documents_with_revisions': documents_with_revisions,
        'documents_revision_percentage': round((documents_with_revisions / total_documents * 100), 2) if total_documents else 0,
    }

def get_client_satisfaction_metrics():
    """
    Get metrics related to client satisfaction based on completed projects
    
    Returns:
        dict: Client satisfaction metrics
    """
    # Get clients with their project statistics
    client_metrics = Client.objects.annotate(
        project_count=Count('projects'),
        completed_on_time=Count(
            'projects', 
            filter=Q(
                projects__status='completed',
                projects__completion_date__lte=F('projects__target_end_date')
            )
        ),
        completed_late=Count(
            'projects',
            filter=Q(
                projects__status='completed',
                projects__completion_date__gt=F('projects__target_end_date')
            )
        )
    )
    
    results = []
    for client in client_metrics:
        completed_projects = client.completed_on_time + client.completed_late
        
        if completed_projects > 0:
            results.append({
                'client_id': client.id,
                'client_name': client.name,
                'total_projects': client.project_count,
                'completed_projects': completed_projects,
                'on_time_completion_rate': round((client.completed_on_time / completed_projects * 100), 2),
                'estimated_satisfaction': 'High' if client.completed_on_time > client.completed_late else 'Medium' if client.completed_on_time == client.completed_late else 'Low'
            })
    
    return {
        'clients_by_satisfaction': sorted(results, key=lambda x: x['on_time_completion_rate'], reverse=True),
        'avg_on_time_rate': sum(c['on_time_completion_rate'] for c in results) / len(results) if results else 0
    }

def get_statistics_summary():
    """
    Get a comprehensive summary of all statistics
    
    Returns:
        dict: Comprehensive statistics summary
    """
    return {
        'project_stats': get_project_completion_stats(),
        'ppap_levels': get_ppap_level_distribution(),
        'output_completion': get_output_completion_rates(),
        'bottlenecks': get_bottleneck_phases(),
        'team_performance': get_team_performance_metrics(),
        'document_trends': get_document_submission_trends(),
        'resource_suggestions': get_resource_allocation_suggestions(),
        'quality_metrics': get_quality_metrics(),
        'client_satisfaction': get_client_satisfaction_metrics()
    }

# Export all functions for use in views
__all__ = [
    'get_project_completion_stats',
    'get_ppap_level_distribution',
    'get_output_completion_rates',
    'get_bottleneck_phases',
    'get_team_performance_metrics',
    'get_document_submission_trends',
    'get_resource_allocation_suggestions',
    'get_quality_metrics',
    'get_client_satisfaction_metrics',
    'get_statistics_summary'
]