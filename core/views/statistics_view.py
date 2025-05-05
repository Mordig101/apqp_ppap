from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from core.services.statistics.api import (
    get_project_completion_stats,
    get_ppap_level_distribution,
    get_output_completion_rates,
    get_bottleneck_phases,
    get_team_performance_metrics,
    get_document_submission_trends,
    get_resource_allocation_suggestions,
    get_quality_metrics,
    get_client_satisfaction_metrics,
    get_statistics_summary
)

class StatisticsViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def projects(self, request):
        """Get project completion statistics"""
        return Response(get_project_completion_stats())
    
    @action(detail=False, methods=['get'])
    def ppap_levels(self, request):
        """Get PPAP level distribution"""
        return Response(get_ppap_level_distribution())
    
    @action(detail=False, methods=['get'])
    def output_completion(self, request):
        """Get output completion rates by phase"""
        return Response(get_output_completion_rates())
    
    @action(detail=False, methods=['get'])
    def bottlenecks(self, request):
        """Identify bottleneck phases"""
        return Response(get_bottleneck_phases())
    
    @action(detail=False, methods=['get'])
    def team_performance(self, request):
        """Get team performance metrics"""
        return Response(get_team_performance_metrics())
    
    @action(detail=False, methods=['get'])
    def document_trends(self, request):
        """Get document submission trends"""
        return Response(get_document_submission_trends())
    
    @action(detail=False, methods=['get'])
    def resource_suggestions(self, request):
        """Get resource allocation suggestions"""
        return Response(get_resource_allocation_suggestions())
    
    @action(detail=False, methods=['get'])
    def quality(self, request):
        """Get quality metrics"""
        return Response(get_quality_metrics())
    
    @action(detail=False, methods=['get'])
    def client_satisfaction(self, request):
        """Get client satisfaction metrics"""
        return Response(get_client_satisfaction_metrics())
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get comprehensive statistics summary"""
        return Response(get_statistics_summary())