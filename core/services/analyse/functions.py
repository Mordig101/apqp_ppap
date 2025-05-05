from django.db.models import Q, F, Count
from django.utils import timezone
from datetime import timedelta
from core.models import Project, Phase, Output, History, Person, Client



def analyze_deadline_violations(project_id):
    """
    Analyze a project with missed deadlines to identify where the problems originated
    """
    project = Project.objects.get(id=project_id)
    phases = Phase.objects.filter(ppap__project=project)
    
    results = {
        'project_name': project.name,
        'is_overdue': project.target_end_date < timezone.now() and project.status != 'completed',
        'days_overdue': (timezone.now() - project.target_end_date).days if project.target_end_date < timezone.now() else 0,
        'phase_violations': [],
        'output_violations': [],
        'responsible_persons': {}
    }
    
    # Find phases that missed deadlines
    for phase in phases:
        phase_history = History.objects.get(id=phase.history_id)
        
        if phase_history.deadline and phase.completion_date:
            if phase.completion_date > phase_history.deadline:
                # Phase completed late
                days_late = (phase.completion_date - phase_history.deadline).days
                
                # Get responsible person
                responsible = "Unknown"
                if hasattr(phase, 'responsible') and phase.responsible:
                    responsible = f"{phase.responsible.first_name} {phase.responsible.last_name}"
                
                results['phase_violations'].append({
                    'phase_name': phase.template.name,
                    'days_late': days_late,
                    'responsible': responsible,
                    'responsible_id': phase.responsible_id if hasattr(phase, 'responsible') else None
                })
                
                # Track responsible people's patterns
                if phase.responsible_id:
                    if phase.responsible_id not in results['responsible_persons']:
                        results['responsible_persons'][phase.responsible_id] = {
                            'name': responsible,
                            'late_items': 1,
                            'total_days_late': days_late
                        }
                    else:
                        results['responsible_persons'][phase.responsible_id]['late_items'] += 1
                        results['responsible_persons'][phase.responsible_id]['total_days_late'] += days_late
    
    # Find outputs that missed deadlines
    for phase in phases:
        outputs = Output.objects.filter(phase=phase)
        
        for output in outputs:
            output_history = History.objects.get(id=output.history_id)
            
            if output_history.deadline and output.completion_date:
                if output.completion_date > output_history.deadline:
                    # Output completed late
                    days_late = (output.completion_date - output_history.deadline).days
                    
                    responsible = "Unknown"
                    if hasattr(output, 'assigned_to') and output.assigned_to:
                        responsible = f"{output.assigned_to.first_name} {output.assigned_to.last_name}"
                    
                    results['output_violations'].append({
                        'output_name': output.template.name,
                        'phase_name': phase.template.name,
                        'days_late': days_late,
                        'responsible': responsible,
                        'responsible_id': output.assigned_to_id if hasattr(output, 'assigned_to') else None
                    })
                    
                    # Track responsible people's patterns
                    if output.assigned_to_id:
                        if output.assigned_to_id not in results['responsible_persons']:
                            results['responsible_persons'][output.assigned_to_id] = {
                                'name': responsible,
                                'late_items': 1,
                                'total_days_late': days_late
                            }
                        else:
                            results['responsible_persons'][output.assigned_to_id]['late_items'] += 1
                            results['responsible_persons'][output.assigned_to_id]['total_days_late'] += days_late
    
    # Generate suggestions
    suggestions = []
    
    # Identify the most problematic phases
    if results['phase_violations']:
        most_late_phase = max(results['phase_violations'], key=lambda x: x['days_late'])
        suggestions.append(f"The '{most_late_phase['phase_name']}' phase was {most_late_phase['days_late']} days late and was a major contributor to the project delay.")
    
    # Identify bottleneck persons
    bottleneck_people = []
    for person_id, data in results['responsible_persons'].items():
        if data['late_items'] > 1:
            bottleneck_people.append({
                'id': person_id,
                'name': data['name'],
                'late_items': data['late_items'],
                'avg_days_late': data['total_days_late'] / data['late_items']
            })
    
    if bottleneck_people:
        bottleneck_people.sort(key=lambda x: x['late_items'], reverse=True)
        for person in bottleneck_people[:3]:  # Top 3 bottleneck people
            suggestions.append(f"{person['name']} was responsible for {person['late_items']} late items (avg. {round(person['avg_days_late'], 1)} days late each).")
    
    results['suggestions'] = suggestions
    
    return results

def analyze_critical_path(project_id):
    """
    Identify the critical path in a project and track its progress
    """
    project = Project.objects.get(id=project_id)
    phases = Phase.objects.filter(ppap__project=project).order_by('template__order')
    
    critical_path = []
    critical_outputs = []
    total_delayed_days = 0
    
    # For each phase, find the output that took the longest
    for phase in phases:
        outputs = Output.objects.filter(phase=phase)
        if not outputs:
            continue
            
        # Find the output that took the longest to complete or is expected to take longest
        longest_output = None
        max_duration = timedelta(days=0)
        
        for output in outputs:
            output_history = History.objects.filter(id=output.history_id).first()
            if not output_history:
                continue
                
            started_at = output_history.started_at or output.created_at
            finished_at = output.completion_date
            
            if finished_at:
                duration = finished_at - started_at
            else:
                # For incomplete outputs, estimate based on similar outputs
                similar_outputs = Output.objects.filter(
                    template=output.template, 
                    status='completed'
                )
                
                if similar_outputs.exists():
                    avg_duration = timedelta(days=0)
                    count = 0
                    
                    for similar in similar_outputs:
                        similar_history = History.objects.get(id=similar.history_id)
                        if similar_history.started_at and similar.completion_date:
                            avg_duration += similar.completion_date - similar_history.started_at
                            count += 1
                    
                    if count > 0:
                        duration = avg_duration / count
                    else:
                        # Default estimation - 5 days
                        duration = timedelta(days=5)
                else:
                    # Default estimation - 5 days
                    duration = timedelta(days=5)
            
            if duration > max_duration:
                max_duration = duration
                longest_output = output
        
        if longest_output:
            critical_path.append({
                'phase_id': phase.id,
                'phase_name': phase.template.name,
                'output_id': longest_output.id,
                'output_name': longest_output.template.name,
                'estimated_duration': max_duration.days,
                'status': longest_output.status,
                'is_delayed': False
            })
            
            # Check if this output is delayed
            output_history = History.objects.get(id=longest_output.history_id)
            if output_history.deadline and (
                (longest_output.status != 'completed' and output_history.deadline < timezone.now()) or
                (longest_output.completion_date and longest_output.completion_date > output_history.deadline)
            ):
                critical_path[-1]['is_delayed'] = True
                
                days_delayed = 0
                if longest_output.completion_date:
                    days_delayed = (longest_output.completion_date - output_history.deadline).days
                else:
                    days_delayed = (timezone.now() - output_history.deadline).days
                
                critical_path[-1]['days_delayed'] = days_delayed
                critical_outputs.append(longest_output.id)
                total_delayed_days += days_delayed
    
    # Find dependencies between critical outputs
    dependencies = []
    for i in range(len(critical_path) - 1):
        current = critical_path[i]
        next_item = critical_path[i + 1]
        
        dependencies.append({
            'from_output_id': current['output_id'],
            'from_output_name': current['output_name'],
            'to_output_id': next_item['output_id'],
            'to_output_name': next_item['output_name'],
            'dependency_type': 'finish_to_start'
        })
    
    # Generate recommendations
    recommendations = []
    if critical_outputs:
        recommendations.append(f"Project is currently delayed by {total_delayed_days} days due to critical path delays.")
        
        # Find the most delayed output in the critical path
        most_delayed = max([item for item in critical_path if item.get('is_delayed', False)], 
                           key=lambda x: x.get('days_delayed', 0), default=None)
        
        if most_delayed:
            recommendations.append(f"Focus on '{most_delayed['output_name']}' in the '{most_delayed['phase_name']}' phase, which is {most_delayed['days_delayed']} days behind schedule.")
            
            # Find who's responsible for this output
            try:
                output = Output.objects.get(id=most_delayed['output_id'])
                if hasattr(output, 'assigned_to') and output.assigned_to:
                    recommendations.append(f"Contact {output.assigned_to.first_name} {output.assigned_to.last_name} who is responsible for this output.")
            except Output.DoesNotExist:
                pass
    
    return {
        'project_name': project.name,
        'critical_path': critical_path,
        'dependencies': dependencies,
        'total_delayed_days': total_delayed_days,
        'recommendations': recommendations
    }
    
def detect_resource_allocation_problems(project_id):
    """
    Identify issues with resource allocation in a project
    """
    project = Project.objects.get(id=project_id)
    outputs = Output.objects.filter(phase__ppap__project=project)
    
    # Get all people assigned to outputs
    assignees = {}
    for output in outputs:
        if not hasattr(output, 'assigned_to_id') or not output.assigned_to_id:
            continue
            
        if output.assigned_to_id not in assignees:
            person = Person.objects.get(id=output.assigned_to_id)
            assignees[output.assigned_to_id] = {
                'name': f"{person.first_name} {person.last_name}",
                'outputs': [],
                'total_outputs': 0,
                'delayed_outputs': 0,
                'delayed_ratio': 0
            }
        
        # Add output to person's list
        output_info = {
            'id': output.id,
            'name': output.template.name,
            'status': output.status,
            'is_delayed': False
        }
        
        # Check if output is delayed
        output_history = History.objects.filter(id=output.history_id).first()
        if output_history and output_history.deadline:
            if ((output.status != 'completed' and output_history.deadline < timezone.now()) or
                (output.completion_date and output.completion_date > output_history.deadline)):
                output_info['is_delayed'] = True
                assignees[output.assigned_to_id]['delayed_outputs'] += 1
        
        assignees[output.assigned_to_id]['outputs'].append(output_info)
        assignees[output.assigned_to_id]['total_outputs'] += 1
    
    # Calculate delay ratios
    for person_id in assignees:
        total = assignees[person_id]['total_outputs']
        delayed = assignees[person_id]['delayed_outputs']
        
        if total > 0:
            assignees[person_id]['delayed_ratio'] = delayed / total
    
    # Identify overloaded resources
    overloaded = []
    for person_id, data in assignees.items():
        if data['total_outputs'] > 5 and data['delayed_ratio'] > 0.3:
            overloaded.append({
                'id': person_id,
                'name': data['name'],
                'total_outputs': data['total_outputs'],
                'delayed_outputs': data['delayed_outputs'],
                'delayed_ratio': data['delayed_ratio']
            })
    
    # Identify underutilized resources who could help
    underutilized = []
    for person_id, data in assignees.items():
        if data['total_outputs'] < 3 and data['delayed_ratio'] < 0.2:
            underutilized.append({
                'id': person_id,
                'name': data['name'],
                'total_outputs': data['total_outputs'],
                'delayed_outputs': data['delayed_outputs'],
                'delayed_ratio': data['delayed_ratio']
            })
    
    # Generate recommendations
    recommendations = []
    if overloaded:
        recommendations.append(f"Project delays likely caused by resource allocation imbalance.")
        
        for person in overloaded:
            recommendations.append(f"{person['name']} is overloaded with {person['total_outputs']} outputs and has {person['delayed_outputs']} delayed items ({round(person['delayed_ratio'] * 100, 1)}% delayed).")
            
            if underutilized:
                for helper in underutilized[:2]:  # Suggest up to 2 people who could help
                    recommendations.append(f"Consider reassigning some tasks from {person['name']} to {helper['name']} who has only {helper['total_outputs']} assigned outputs.")
    
    return {
        'project_name': project.name,
        'overloaded_resources': overloaded,
        'underutilized_resources': underutilized,
        'recommendations': recommendations
    }
def generate_early_warnings():
    """
    Generate early warnings about potential project issues before they become critical
    """
    warnings = []
    now = timezone.now()
    
    # 1. Approaching deadlines with little progress
    upcoming_deadlines = Output.objects.filter(
        status__in=['Not Started', 'In Progress'],
        history__deadline__lte=now + timedelta(days=7)
    ).select_related('phase', 'phase__ppap', 'phase__ppap__project', 'template')
    
    for output in upcoming_deadlines:
        project = output.phase.ppap.project
        days_left = (output.history.deadline - now).days
        
        warnings.append({
            'level': 'high' if days_left <= 3 else 'medium',
            'type': 'approaching_deadline',
            'message': f"Output '{output.template.name}' in project '{project.name}' is due in {days_left} days but is still '{output.status}'",
            'project_id': project.id,
            'project_name': project.name,
            'entity_type': 'output',
            'entity_id': output.id,
            'entity_name': output.template.name,
            'days_left': days_left,
            'responsible_id': output.assigned_to_id if hasattr(output, 'assigned_to_id') else None
        })
    
    # 2. Projects with stuck phases (phases that have been in the same status for too long)
    stuck_phases = Phase.objects.filter(
        status='In Progress',
        updated_at__lte=now - timedelta(days=14)  # No updates for 2 weeks
    ).select_related('ppap', 'ppap__project', 'template')
    
    for phase in stuck_phases:
        project = phase.ppap.project
        days_stuck = (now - phase.updated_at).days
        
        warnings.append({
            'level': 'medium',
            'type': 'stuck_phase',
            'message': f"Phase '{phase.template.name}' in project '{project.name}' has been '{phase.status}' for {days_stuck} days with no updates",
            'project_id': project.id,
            'project_name': project.name,
            'entity_type': 'phase',
            'entity_id': phase.id,
            'entity_name': phase.template.name,
            'days_stuck': days_stuck,
            'responsible_id': phase.responsible_id if hasattr(phase, 'responsible_id') else None
        })
    
    # 3. Output blocks (outputs that are blocking others)
    # Get phases where some outputs are complete but others aren't
    active_phases = Phase.objects.filter(status='In Progress')
    
    for phase in active_phases:
        outputs = Output.objects.filter(phase=phase)
        completed = outputs.filter(status='Completed').count()
        total = outputs.count()
        
        if completed > 0 and completed < total:
            # There are both completed and incomplete outputs, check for dependencies
            incomplete = outputs.filter(~Q(status='Completed'))
            
            for output in incomplete:
                # Check if this output has dependencies
                if hasattr(output, 'depends_on') and output.depends_on.exists():
                    project = phase.ppap.project
                    
                    warnings.append({
                        'level': 'medium',
                        'type': 'dependency_block',
                        'message': f"Output '{output.template.name}' in project '{project.name}' may be blocked by dependencies",
                        'project_id': project.id,
                        'project_name': project.name,
                        'entity_type': 'output',
                        'entity_id': output.id,
                        'entity_name': output.template.name,
                        'responsible_id': output.assigned_to_id if hasattr(output, 'assigned_to_id') else None
                    })
    
    # 4. Resource overallocation based on current workload
    persons_with_too_many_active_outputs = Person.objects.annotate(
        active_outputs=Count('outputs', filter=~Q(outputs__status__in=['Completed', 'Cancelled']))
    ).filter(active_outputs__gt=5)
    
    for person in persons_with_too_many_active_outputs:
        person_outputs = Output.objects.filter(
            assigned_to=person,
            status__in=['Not Started', 'In Progress']
        ).order_by('history__deadline')
        
        if person_outputs.exists():
            upcoming = person_outputs.first()
            project = upcoming.phase.ppap.project
            
            warnings.append({
                'level': 'medium',
                'type': 'resource_overallocation',
                'message': f"{person.first_name} {person.last_name} has {person.active_outputs} active outputs and may not complete them all on time",
                'project_id': project.id,
                'project_name': project.name,
                'entity_type': 'person',
                'entity_id': person.id,
                'entity_name': f"{person.first_name} {person.last_name}",
                'active_outputs': person.active_outputs,
                'responsible_id': person.id
            })
    
    return sorted(warnings, key=lambda x: {'high': 0, 'medium': 1, 'low': 2}[x['level']])

def analyze_historical_patterns(team_id=None):
    """
    Analyze historical patterns in project delays to identify recurring issues
    """
    completed_projects = Project.objects.filter(status='completed')
    if team_id:
        completed_projects = completed_projects.filter(team_id=team_id)
    
    if not completed_projects.exists():
        return {
            'message': "No completed projects to analyze",
            'patterns': []
        }
        
    total_projects = completed_projects.count()
    delayed_projects = completed_projects.filter(
        completion_date__gt=F('target_end_date')
    ).count()
    
    delayed_ratio = delayed_projects / total_projects if total_projects > 0 else 0
    
    patterns = []
    
    # 1. Identify phases that are frequently delayed
    phase_delays = {}
    for project in completed_projects:
        phases = Phase.objects.filter(ppap__project=project)
        
        for phase in phases:
            phase_name = phase.template.name
            if phase_name not in phase_delays:
                phase_delays[phase_name] = {
                    'total': 0,
                    'delayed': 0,
                    'project_ids': []
                }
            
            phase_delays[phase_name]['total'] += 1
            phase_delays[phase_name]['project_ids'].append(project.id)
            
            phase_history = History.objects.filter(id=phase.history_id).first()
            if phase_history and phase_history.deadline and phase.completion_date:
                if phase.completion_date > phase_history.deadline:
                    phase_delays[phase_name]['delayed'] += 1
    
    # Find phases with high delay rates
    problematic_phases = []
    for phase_name, data in phase_delays.items():
        if data['total'] >= 3:  # Only consider phases that appeared in at least 3 projects
            delay_rate = data['delayed'] / data['total']
            
            if delay_rate > 0.3:  # More than 30% of the time this phase is delayed
                problematic_phases.append({
                    'phase_name': phase_name,
                    'delay_rate': delay_rate,
                    'total_occurrences': data['total'],
                    'delayed_occurrences': data['delayed'],
                    'project_ids': data['project_ids']
                })
    
    if problematic_phases:
        problematic_phases.sort(key=lambda x: x['delay_rate'], reverse=True)
        patterns.append({
            'type': 'problematic_phase',
            'description': f"Phase '{problematic_phases[0]['phase_name']}' is delayed {round(problematic_phases[0]['delay_rate'] * 100)}% of the time",
            'data': problematic_phases
        })
    
    # 2. Identify people who are frequently responsible for delays
    person_delays = {}
    # Get delayed outputs
    delayed_outputs = Output.objects.filter(
        phase__ppap__project__in=completed_projects,
        completion_date__gt=F('history__deadline')
    )
    
    for output in delayed_outputs:
        if not hasattr(output, 'assigned_to_id') or not output.assigned_to_id:
            continue
            
        person_id = output.assigned_to_id
        if person_id not in person_delays:
            person = Person.objects.get(id=person_id)
            person_delays[person_id] = {
                'name': f"{person.first_name} {person.last_name}",
                'delayed_outputs': 0,
                'projects': set()
            }
        
        person_delays[person_id]['delayed_outputs'] += 1
        person_delays[person_id]['projects'].add(output.phase.ppap.project_id)
    
    # Find people with patterns of delays
    delay_prone_people = []
    for person_id, data in person_delays.items():
        if data['delayed_outputs'] >= 3 and len(data['projects']) >= 2:
            delay_prone_people.append({
                'person_id': person_id,
                'name': data['name'],
                'delayed_outputs': data['delayed_outputs'],
                'projects_count': len(data['projects']),
                'project_ids': list(data['projects'])
            })
    
    if delay_prone_people:
        delay_prone_people.sort(key=lambda x: x['delayed_outputs'], reverse=True)
        patterns.append({
            'type': 'delay_prone_people',
            'description': f"{delay_prone_people[0]['name']} has a pattern of delays across {delay_prone_people[0]['projects_count']} projects",
            'data': delay_prone_people
        })
    
    # 3. Identify client-specific patterns
    client_delays = {}
    for project in completed_projects:
        client_id = project.client_id
        if not client_id:
            continue
            
        if client_id not in client_delays:
            client = Client.objects.get(id=client_id)
            client_delays[client_id] = {
                'name': client.name,
                'total_projects': 0,
                'delayed_projects': 0,
                'project_ids': []
            }
        
        client_delays[client_id]['total_projects'] += 1
        client_delays[client_id]['project_ids'].append(project.id)
        
        if project.completion_date and project.target_end_date and project.completion_date > project.target_end_date:
            client_delays[client_id]['delayed_projects'] += 1
    
    # Find clients with high delay rates
    problematic_clients = []
    for client_id, data in client_delays.items():
        if data['total_projects'] >= 2:  # Only consider clients with at least 2 projects
            delay_rate = data['delayed_projects'] / data['total_projects']
            
            if delay_rate > 0.5:  # More than 50% of projects for this client are delayed
                problematic_clients.append({
                    'client_id': client_id,
                    'name': data['name'],
                    'delay_rate': delay_rate,
                    'total_projects': data['total_projects'],
                    'delayed_projects': data['delayed_projects'],
                    'project_ids': data['project_ids']
                })
    
    if problematic_clients:
        problematic_clients.sort(key=lambda x: x['delay_rate'], reverse=True)
        patterns.append({
            'type': 'problematic_client',
            'description': f"Projects for client '{problematic_clients[0]['name']}' are delayed {round(problematic_clients[0]['delay_rate'] * 100)}% of the time",
            'data': problematic_clients
        })
    
    # Generate insights and recommendations
    insights = []
    if delayed_ratio > 0.3:
        insights.append(f"{round(delayed_ratio * 100)}% of projects are completed after their deadline.")
    
    if patterns:
        for pattern in patterns:
            insights.append(pattern['description'])
    
    return {
        'total_projects': total_projects,
        'delayed_projects': delayed_projects,
        'delayed_ratio': delayed_ratio,
        'patterns': patterns,
        'insights': insights
    }