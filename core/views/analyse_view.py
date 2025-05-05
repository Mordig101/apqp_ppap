from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.db import transaction

from core.services.analyse.api import (
    analyze_deadline_violations,
    analyze_critical_path,
    detect_resource_allocation_problems,
    generate_early_warnings,
    analyze_historical_patterns
)

class AnalyseViewSet(viewsets.ViewSet):
    """ViewSet for project analysis"""
    permission_classes = [IsAuthenticated]
    
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