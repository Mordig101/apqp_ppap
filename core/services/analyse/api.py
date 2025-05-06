from django.db.models import Q, Count, Avg, F, ExpressionWrapper, DurationField
from django.utils import timezone
from datetime import timedelta
import json

from core.models import (
    Project, PPAP, Phase, Output, History, 
    User, Team, Document, Todo
)

def analyze_deadline_violations(project_id):
    """
    Analyze deadline violations for a project
    
    Args:
        project_id (int): ID of the project to analyze
        
    Returns:
        dict: Analysis of deadline violations including:
            - overdue_phases: List of phases that are past their deadline
            - overdue_outputs: List of outputs that are past their deadline
            - resource_impacts: Resources affected by these violations
            - completion_risk: Risk assessment for project completion
    """
    try:
        # Get project and related data
        project = Project.objects.get(id=project_id)
        ppap = PPAP.objects.filter(project=project).first()
        
        if not ppap:
            return {
                "overdue_phases": [],
                "overdue_outputs": [],
                "resource_impacts": [],
                "completion_risk": "low",
                "message": "No PPAP associated with this project"
            }
        
        # Get phases and analyze phase deadlines
        phases = Phase.objects.filter(ppap=ppap)
        overdue_phases = []
        now = timezone.now()
        
        for phase in phases:
            # Get history for this phase
            history = History.objects.filter(id=phase.history_id).first()
            
            if history and history.deadline and history.deadline < now and phase.status not in ['Completed', 'Approved']:
                days_overdue = (now - history.deadline).days
                
                overdue_phases.append({
                    "phase_id": phase.id,
                    "phase_name": phase.template.name if phase.template else "Unknown Phase",
                    "deadline": history.deadline.isoformat(),
                    "days_overdue": days_overdue,
                    "status": phase.status,
                    "responsible": phase.responsible.username if phase.responsible else None
                })
        
        # Get outputs and analyze output deadlines
        outputs = Output.objects.filter(phase__in=phases)
        overdue_outputs = []
        
        for output in outputs:
            # Get history for this output
            history = History.objects.filter(id=output.history_id).first()
            
            if history and history.deadline and history.deadline < now and output.status not in ['Completed', 'Approved']:
                days_overdue = (now - history.deadline).days
                
                overdue_outputs.append({
                    "output_id": output.id,
                    "output_name": output.template.name if output.template else "Unknown Output",
                    "phase_id": output.phase.id,
                    "phase_name": output.phase.template.name if output.phase and output.phase.template else "Unknown Phase",
                    "deadline": history.deadline.isoformat(),
                    "days_overdue": days_overdue,
                    "status": output.status,
                    "responsible": output.user.username if output.user else None
                })
        
        # Analyze resource impacts
        resource_impacts = []
        affected_users = set()
        
        # Collect users responsible for overdue items
        for phase in overdue_phases:
            if phase["responsible"]:
                affected_users.add(phase["responsible"])
                
        for output in overdue_outputs:
            if output["responsible"]:
                affected_users.add(output["responsible"])
        
        # Get workload for each affected user
        for username in affected_users:
            user = User.objects.filter(username=username).first()
            if user:
                # Count todos assigned to this user
                todos = Todo.objects.filter(user=user)
                
                resource_impacts.append({
                    "user": username,
                    "total_todos": todos.count(),
                    "overdue_items": sum(1 for output in overdue_outputs if output["responsible"] == username) +
                                     sum(1 for phase in overdue_phases if phase["responsible"] == username)
                })
        
        # Calculate completion risk
        completion_risk = "low"
        total_phases = len(phases)
        overdue_count = len(overdue_phases)
        
        if total_phases > 0:
            overdue_percentage = (overdue_count / total_phases) * 100
            
            if overdue_percentage > 50:
                completion_risk = "high"
            elif overdue_percentage > 25:
                completion_risk = "medium"
        
        return {
            "overdue_phases": overdue_phases,
            "overdue_outputs": overdue_outputs,
            "resource_impacts": resource_impacts,
            "completion_risk": completion_risk
        }
            
    except Project.DoesNotExist:
        return {
            "error": f"Project with ID {project_id} not found"
        }
    except Exception as e:
        return {
            "error": str(e)
        }

def analyze_critical_path(project_id):
    """
    Analyze critical path for project completion
    
    Args:
        project_id (int): ID of the project to analyze
        
    Returns:
        dict: Critical path analysis including:
            - critical_path: List of critical path items
            - bottlenecks: Identified bottlenecks
            - estimated_completion: Estimated completion date
    """
    try:
        # Get project and related data
        project = Project.objects.get(id=project_id)
        ppap = PPAP.objects.filter(project=project).first()
        
        if not ppap:
            return {
                "critical_path": [],
                "bottlenecks": [],
                "estimated_completion": None,
                "message": "No PPAP associated with this project"
            }
        
        # Get phases sorted by order
        phases = Phase.objects.filter(ppap=ppap).order_by('template__order')
        critical_path = []
        bottlenecks = []
        
        last_completion_date = None
        now = timezone.now()
        
        for phase in phases:
            # Get history for this phase
            history = History.objects.filter(id=phase.history_id).first()
            phase_name = phase.template.name if phase.template else "Unknown Phase"
            
            # Get outputs for this phase
            outputs = Output.objects.filter(phase=phase)
            
            # Find critical outputs (longest duration or furthest deadline)
            critical_outputs = []
            furthest_deadline = None
            
            for output in outputs:
                output_history = History.objects.filter(id=output.history_id).first()
                output_name = output.template.name if output.template else "Unknown Output"
                
                if output_history and output_history.deadline:
                    if not furthest_deadline or output_history.deadline > furthest_deadline:
                        furthest_deadline = output_history.deadline
                        
                    # Calculate estimated completion based on similar outputs
                    similar_outputs = Output.objects.filter(
                        template=output.template,
                        status__in=['Completed', 'Approved']
                    )
                    
                    avg_duration = None
                    if similar_outputs.exists():
                        # Calculate average completion time for similar outputs
                        durations = []
                        for sim_output in similar_outputs:
                            sim_history = History.objects.filter(id=sim_output.history_id).first()
                            if sim_history and sim_history.started_at and sim_history.finished_at:
                                duration = (sim_history.finished_at - sim_history.started_at).days
                                durations.append(duration)
                        
                        if durations:
                            avg_duration = sum(durations) / len(durations)
                    
                    critical_outputs.append({
                        "output_id": output.id,
                        "output_name": output_name,
                        "deadline": output_history.deadline.isoformat() if output_history.deadline else None,
                        "status": output.status,
                        "avg_duration": avg_duration,
                        "responsible": output.user.username if output.user else None
                    })
            
            # Add phase to critical path
            phase_deadline = history.deadline.isoformat() if history and history.deadline else None
            estimated_completion = None
            
            if phase.status in ['Completed', 'Approved'] and history and history.finished_at:
                estimated_completion = history.finished_at
            elif furthest_deadline:
                estimated_completion = furthest_deadline
            elif history and history.deadline:
                estimated_completion = history.deadline
            
            # Track the latest completion date to use for subsequent phases
            if estimated_completion:
                last_completion_date = estimated_completion
            
            critical_path.append({
                "phase_id": phase.id,
                "phase_name": phase_name,
                "status": phase.status,
                "deadline": phase_deadline,
                "estimated_completion": estimated_completion.isoformat() if estimated_completion else None,
                "critical_outputs": critical_outputs,
                "depends_on_previous": last_completion_date is not None
            })
            
            # Identify bottlenecks
            if phase.status not in ['Completed', 'Approved']:
                # Check for missing responsible person
                if not phase.responsible:
                    bottlenecks.append({
                        "type": "missing_responsible",
                        "phase_id": phase.id,
                        "phase_name": phase_name,
                        "impact": "high",
                        "recommendation": "Assign a responsible person to this phase"
                    })
                
                # Check for overdue phase
                if history and history.deadline and history.deadline < now:
                    bottlenecks.append({
                        "type": "overdue_phase",
                        "phase_id": phase.id,
                        "phase_name": phase_name,
                        "days_overdue": (now - history.deadline).days,
                        "impact": "high",
                        "recommendation": "Review and address phase delay"
                    })
                
                # Check for resource overallocation
                if phase.responsible:
                    user = User.objects.filter(username=phase.responsible.username).first()
                    if user:
                        # Count todos assigned to this user
                        todos = Todo.objects.filter(user=user)
                        if todos.count() > 10:  # Arbitrary threshold for overallocation
                            bottlenecks.append({
                                "type": "resource_overallocation",
                                "phase_id": phase.id,
                                "phase_name": phase_name,
                                "responsible": phase.responsible.username,
                                "todos_count": todos.count(),
                                "impact": "medium",
                                "recommendation": "Consider redistributing work or adjusting timeline"
                            })
        
        # Calculate overall estimated completion
        project_estimated_completion = None
        if critical_path and critical_path[-1].get("estimated_completion"):
            project_estimated_completion = critical_path[-1]["estimated_completion"]
        
        return {
            "critical_path": critical_path,
            "bottlenecks": bottlenecks,
            "estimated_completion": project_estimated_completion
        }
            
    except Project.DoesNotExist:
        return {
            "error": f"Project with ID {project_id} not found"
        }
    except Exception as e:
        return {
            "error": str(e)
        }

def detect_resource_allocation_problems(project_id):
    """
    Detect resource allocation problems for a project
    
    Args:
        project_id (int): ID of the project to analyze
        
    Returns:
        dict: Resource allocation analysis including:
            - overallocated_resources: Resources with too many tasks
            - underutilized_resources: Resources with few tasks
            - skill_mismatches: Resources assigned to tasks that don't match their skills
            - recommendations: Suggested actions to address problems
    """
    try:
        # Get project and related data
        project = Project.objects.get(id=project_id)
        ppap = PPAP.objects.filter(project=project).first()
        
        if not ppap:
            return {
                "overallocated_resources": [],
                "underutilized_resources": [],
                "skill_mismatches": [],
                "recommendations": []
            }
        
        # Get all phases and outputs
        phases = Phase.objects.filter(ppap=ppap)
        outputs = Output.objects.filter(phase__in=phases)
        
        # Collect all users involved in the project
        involved_users = set()
        
        for phase in phases:
            if phase.responsible:
                involved_users.add(phase.responsible)
        
        for output in outputs:
            if output.user:
                involved_users.add(output.user)
        
        # Analyze resource allocation
        overallocated_resources = []
        underutilized_resources = []
        
        for user in involved_users:
            # Count todos assigned to this user
            todos = Todo.objects.filter(user=user)
            todos_count = todos.count()
            
            # Count active outputs assigned to this user
            active_outputs = outputs.filter(
                user=user, 
                status__in=['Not Started', 'In Progress']
            ).count()
            
            # Count active phases where user is responsible
            active_phases = phases.filter(
                responsible=user,
                status__in=['Not Started', 'In Progress']
            ).count()
            
            total_workload = todos_count + active_outputs + active_phases
            
            # Check for overallocation (arbitrary thresholds)
            if total_workload > 15:
                overallocated_resources.append({
                    "user": user.username,
                    "total_workload": total_workload,
                    "todos": todos_count,
                    "active_outputs": active_outputs,
                    "active_phases": active_phases,
                    "severity": "high" if total_workload > 25 else "medium"
                })
            elif total_workload < 3:  # Check for underutilization
                underutilized_resources.append({
                    "user": user.username,
                    "total_workload": total_workload,
                    "todos": todos_count,
                    "active_outputs": active_outputs,
                    "active_phases": active_phases
                })
        
        # Generate recommendations
        recommendations = []
        
        if overallocated_resources:
            for resource in overallocated_resources:
                if resource["severity"] == "high":
                    recommendations.append({
                        "type": "redistribution",
                        "description": f"Redistribute tasks from {resource['user']} who is severely overallocated",
                        "priority": "high"
                    })
                else:
                    recommendations.append({
                        "type": "monitoring",
                        "description": f"Monitor workload for {resource['user']} who may be overallocated",
                        "priority": "medium"
                    })
        
        if underutilized_resources and overallocated_resources:
            recommendations.append({
                "type": "reallocation",
                "description": "Consider reallocating tasks from overallocated resources to underutilized ones",
                "priority": "high"
            })
        
        # Check for deadline conflicts
        deadline_conflicts = []
        
        for user in involved_users:
            user_outputs = outputs.filter(user=user)
            upcoming_deadlines = []
            
            for output in user_outputs:
                history = History.objects.filter(id=output.history_id).first()
                if history and history.deadline and output.status not in ['Completed', 'Approved']:
                    upcoming_deadlines.append({
                        "output_id": output.id,
                        "output_name": output.template.name if output.template else "Unknown Output",
                        "deadline": history.deadline
                    })
            
            # Sort by deadline
            upcoming_deadlines = sorted(upcoming_deadlines, key=lambda x: x["deadline"])
            
            # Check for deadlines that are close to each other (within 3 days)
            for i in range(len(upcoming_deadlines) - 1):
                days_between = (upcoming_deadlines[i+1]["deadline"] - upcoming_deadlines[i]["deadline"]).days
                if days_between < 3:
                    deadline_conflicts.append({
                        "user": user.username,
                        "output1": upcoming_deadlines[i]["output_name"],
                        "deadline1": upcoming_deadlines[i]["deadline"].isoformat(),
                        "output2": upcoming_deadlines[i+1]["output_name"],
                        "deadline2": upcoming_deadlines[i+1]["deadline"].isoformat(),
                        "days_between": days_between
                    })
                    
                    recommendations.append({
                        "type": "deadline_adjustment",
                        "description": f"Adjust deadlines for {user.username} who has multiple deliverables due within {days_between} days",
                        "priority": "medium"
                    })
        
        return {
            "overallocated_resources": overallocated_resources,
            "underutilized_resources": underutilized_resources,
            "deadline_conflicts": deadline_conflicts,
            "recommendations": recommendations
        }
            
    except Project.DoesNotExist:
        return {
            "error": f"Project with ID {project_id} not found"
        }
    except Exception as e:
        return {
            "error": str(e)
        }

def generate_early_warnings():
    """
    Generate early warnings about potential issues across all projects
    
    Returns:
        list: List of early warning items with details
    """
    warnings = []
    now = timezone.now()
    
    try:
        # 1. Check for phases approaching deadlines
        phases = Phase.objects.filter(
            status__in=['Not Started', 'In Progress']
        )
        
        for phase in phases:
            history = History.objects.filter(id=phase.history_id).first()
            if history and history.deadline:
                days_to_deadline = (history.deadline - now).days
                
                if 0 <= days_to_deadline <= 7:  # Within a week of deadline
                    # Get outputs for this phase
                    outputs = Output.objects.filter(phase=phase)
                    completed_outputs = outputs.filter(status__in=['Completed', 'Approved']).count()
                    total_outputs = outputs.count()
                    
                    completion_percentage = completed_outputs / total_outputs * 100 if total_outputs > 0 else 0
                    
                    if completion_percentage < 70:  # Less than 70% complete and close to deadline
                        warnings.append({
                            "type": "approaching_deadline",
                            "level": "high" if days_to_deadline <= 3 else "medium",
                            "entity_type": "phase",
                            "entity_id": phase.id,
                            "project_id": phase.ppap.project_id if phase.ppap else None,
                            "project_name": phase.ppap.project.name if phase.ppap and phase.ppap.project else "Unknown Project",
                            "entity_name": phase.template.name if phase.template else "Unknown Phase",
                            "days_to_deadline": days_to_deadline,
                            "completion_percentage": completion_percentage,
                            "responsible": phase.responsible.username if phase.responsible else None
                        })
        
        # 2. Check for stalled outputs (no activity for over 14 days)
        outputs = Output.objects.filter(
            status='In Progress'
        )
        
        for output in outputs:
            history = History.objects.filter(id=output.history_id).first()
            if history and history.updated_at:
                days_since_update = (now - history.updated_at).days
                
                if days_since_update > 14:  # No activity for over 2 weeks
                    warnings.append({
                        "type": "stalled_activity",
                        "level": "medium",
                        "entity_type": "output",
                        "entity_id": output.id,
                        "project_id": output.phase.ppap.project_id if output.phase and output.phase.ppap else None,
                        "project_name": output.phase.ppap.project.name if output.phase and output.phase.ppap and output.phase.ppap.project else "Unknown Project",
                        "entity_name": output.template.name if output.template else "Unknown Output",
                        "days_inactive": days_since_update,
                        "responsible": output.user.username if output.user else None
                    })
        
        # 3. Check for projects without recent activity
        projects = Project.objects.filter(
            status__in=['In Progress', 'Not Started', 'On Hold']
        )
        
        for project in projects:
            history = History.objects.filter(id=project.history_id).first()
            
            if history and history.updated_at:
                days_since_update = (now - history.updated_at).days
                
                if days_since_update > 30:  # No activity for over a month
                    warnings.append({
                        "type": "inactive_project",
                        "level": "medium",
                        "entity_type": "project",
                        "entity_id": project.id,
                        "project_id": project.id,
                        "project_name": project.name,
                        "days_inactive": days_since_update
                    })
        
        # 4. Check for phases without assigned responsible
        phases_no_responsible = Phase.objects.filter(
            responsible=None,
            status__in=['Not Started', 'In Progress']
        )
        
        for phase in phases_no_responsible:
            warnings.append({
                "type": "unassigned_responsibility",
                "level": "high",
                "entity_type": "phase",
                "entity_id": phase.id,
                "project_id": phase.ppap.project_id if phase.ppap else None,
                "project_name": phase.ppap.project.name if phase.ppap and phase.ppap.project else "Unknown Project",
                "entity_name": phase.template.name if phase.template else "Unknown Phase"
            })
        
        # 5. Check for outputs with rejected status
        rejected_outputs = Output.objects.filter(status='Rejected')
        
        for output in rejected_outputs:
            warnings.append({
                "type": "rejected_output",
                "level": "high",
                "entity_type": "output",
                "entity_id": output.id,
                "project_id": output.phase.ppap.project_id if output.phase and output.phase.ppap else None,
                "project_name": output.phase.ppap.project.name if output.phase and output.phase.ppap and output.phase.ppap.project else "Unknown Project",
                "entity_name": output.template.name if output.template else "Unknown Output",
                "responsible": output.user.username if output.user else None
            })
        
        # 6. Check for overdue deadlines
        histories_with_deadlines = History.objects.filter(
            deadline__lt=now,
            finished_at=None
        )
        
        for history in histories_with_deadlines:
            entity_type = history.table_name
            entity_name = history.title
            project_id = None
            project_name = "Unknown Project"
            days_overdue = (now - history.deadline).days
            
            # Try to determine project info based on entity type
            if entity_type == 'phase':
                phase = Phase.objects.filter(history_id=history.id).first()
                if phase and phase.ppap and phase.ppap.project:
                    project_id = phase.ppap.project.id
                    project_name = phase.ppap.project.name
            elif entity_type == 'output':
                output = Output.objects.filter(history_id=history.id).first()
                if output and output.phase and output.phase.ppap and output.phase.ppap.project:
                    project_id = output.phase.ppap.project.id
                    project_name = output.phase.ppap.project.name
            elif entity_type == 'project':
                project = Project.objects.filter(history_id=history.id).first()
                if project:
                    project_id = project.id
                    project_name = project.name
            
            warnings.append({
                "type": "overdue_deadline",
                "level": "high",
                "entity_type": entity_type,
                "entity_id": history.id,
                "project_id": project_id,
                "project_name": project_name,
                "entity_name": entity_name,
                "days_overdue": days_overdue,
                "deadline": history.deadline.isoformat()
            })
        
        # Sort warnings by level (high first) and days to deadline
        warnings = sorted(warnings, key=lambda w: (0 if w["level"] == "high" else 1, w.get("days_to_deadline", 0)))
        
        return warnings
    except Exception as e:
        return [{"error": str(e)}]

def analyze_historical_patterns(team_id=None):
    """
    Analyze historical patterns in project delays and bottlenecks
    
    Args:
        team_id (int, optional): ID of the team to analyze
        
    Returns:
        dict: Historical patterns analysis including:
            - delay_patterns: Common causes of delays
            - bottleneck_phases: Phases that are frequently bottlenecks
            - timeline_trends: Trends in timeline adherence over time
    """
    try:
        # Get completed projects
        projects_query = Project.objects.filter(status='Completed')
        
        if team_id:
            projects_query = projects_query.filter(team_id=team_id)
        
        projects = projects_query.all()
        
        if not projects:
            return {
                "delay_patterns": [],
                "bottleneck_phases": [],
                "timeline_trends": [],
                "message": "No completed projects available for analysis"
            }
        
        # Analyze delay patterns
        delay_patterns = []
        bottleneck_phases = {}
        timeline_trends = []
        
        # Look at each project's history
        for project in projects:
            # Get project history
            project_history = History.objects.filter(id=project.history_id).first()
            
            if not project_history or not project_history.started_at or not project_history.finished_at:
                continue
                
            # Calculate project duration
            project_duration = (project_history.finished_at - project_history.started_at).days
            
            # Check if project was on time
            on_time = True
            if project_history.deadline:
                on_time = project_history.finished_at <= project_history.deadline
            
            # Get PPAP
            ppap = PPAP.objects.filter(project=project).first()
            
            if not ppap:
                continue
                
            # Get phases
            phases = Phase.objects.filter(ppap=ppap)
            
            # Analyze each phase
            for phase in phases:
                phase_history = History.objects.filter(id=phase.history_id).first()
                
                if not phase_history:
                    continue
                
                # Check if phase was delayed
                phase_delayed = False
                if phase_history.deadline and phase_history.finished_at:
                    phase_delayed = phase_history.finished_at > phase_history.deadline
                
                if phase_delayed:
                    phase_name = phase.template.name if phase.template else "Unknown Phase"
                    
                    # Track this as a bottleneck phase
                    if phase_name not in bottleneck_phases:
                        bottleneck_phases[phase_name] = {
                            "count": 0,
                            "total_delay_days": 0,
                            "outputs": {}
                        }
                    
                    bottleneck_phases[phase_name]["count"] += 1
                    
                    if phase_history.deadline and phase_history.finished_at:
                        delay_days = (phase_history.finished_at - phase_history.deadline).days
                        bottleneck_phases[phase_name]["total_delay_days"] += delay_days
                    
                    # Analyze outputs to find specific bottlenecks
                    outputs = Output.objects.filter(phase=phase)
                    
                    for output in outputs:
                        output_history = History.objects.filter(id=output.history_id).first()
                        output_name = output.template.name if output.template else "Unknown Output"
                        
                        if output_history and output_history.deadline and output_history.finished_at and output_history.finished_at > output_history.deadline:
                            # This output was delayed
                            if output_name not in bottleneck_phases[phase_name]["outputs"]:
                                bottleneck_phases[phase_name]["outputs"][output_name] = 0
                            
                            bottleneck_phases[phase_name]["outputs"][output_name] += 1
            
            # Add to timeline trends
            completion_year_month = project_history.finished_at.strftime("%Y-%m")
            
            timeline_trends.append({
                "project_id": project.id,
                "project_name": project.name,
                "completion_date": project_history.finished_at.isoformat(),
                "on_time": on_time,
                "duration_days": project_duration
            })
        
        # Format bottleneck phases for the response
        bottleneck_phases_list = []
        for phase_name, data in bottleneck_phases.items():
            avg_delay = data["total_delay_days"] / data["count"] if data["count"] > 0 else 0
            
            # Sort outputs by frequency
            outputs = [{"name": name, "frequency": count} for name, count in data["outputs"].items()]
            outputs = sorted(outputs, key=lambda x: x["frequency"], reverse=True)
            
            bottleneck_phases_list.append({
                "phase_name": phase_name,
                "frequency": data["count"],
                "avg_delay_days": avg_delay,
                "problem_outputs": outputs[:5]  # Top 5 problematic outputs
            })
        
        # Sort bottlenecks by frequency
        bottleneck_phases_list = sorted(bottleneck_phases_list, key=lambda x: x["frequency"], reverse=True)
        
        # Analyze timeline trends over time
        timeline_by_month = {}
        for project in timeline_trends:
            completion_date = project["completion_date"][:7]  # YYYY-MM format
            
            if completion_date not in timeline_by_month:
                timeline_by_month[completion_date] = {
                    "month": completion_date,
                    "total_projects": 0,
                    "on_time_projects": 0,
                    "avg_duration": 0
                }
            
            timeline_by_month[completion_date]["total_projects"] += 1
            if project["on_time"]:
                timeline_by_month[completion_date]["on_time_projects"] += 1
                
            # Update average duration
            current_count = timeline_by_month[completion_date]["total_projects"]
            current_avg = timeline_by_month[completion_date]["avg_duration"]
            new_duration = project["duration_days"]
            
            # Recalculate the average
            timeline_by_month[completion_date]["avg_duration"] = (
                (current_avg * (current_count - 1)) + new_duration
            ) / current_count
        
        # Convert to list and calculate on-time percentage
        timeline_by_month_list = []
        for month_data in timeline_by_month.values():
            on_time_percentage = (
                month_data["on_time_projects"] / month_data["total_projects"] * 100
                if month_data["total_projects"] > 0 else 0
            )
            
            timeline_by_month_list.append({
                "month": month_data["month"],
                "total_projects": month_data["total_projects"],
                "on_time_percentage": on_time_percentage,
                "avg_duration_days": month_data["avg_duration"]
            })
        
        # Sort by month
        timeline_by_month_list = sorted(timeline_by_month_list, key=lambda x: x["month"])
        
        return {
            "bottleneck_phases": bottleneck_phases_list,
            "timeline_trends": {
                "by_project": timeline_trends,
                "by_month": timeline_by_month_list
            }
        }
            
    except Exception as e:
        return {
            "error": str(e)
        }