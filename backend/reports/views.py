"""
Views for reports app.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework import generics
from rest_framework.response import Response
from accounts.permissions import IsViewerOrAbove, IsUserOrAbove
from accounts.models import Organization
from .generator import (
    generate_asset_inventory_report,
    generate_risk_summary_report,
    generate_vulnerability_report
)
from .compliance import (
    generate_iso27001_report,
    generate_pci_dss_report,
    generate_sbp_report
)
from .models import ScheduledReport
from .serializers import ScheduledReportSerializer
from django.utils import timezone
from datetime import timedelta


@api_view(['GET'])
@permission_classes([IsUserOrAbove])  # Viewers cannot generate reports
def generate_report(request):
    """Generate report endpoint. Viewers cannot generate reports."""
    report_type = request.query_params.get('type', 'inventory')
    format_type = request.query_params.get('format', 'csv')
    
    user = request.user
    if user.role == 'super_admin':
        org_id = request.query_params.get('organization_id')
        if org_id:
            organization = Organization.objects.get(id=org_id)
        else:
            return Response({'error': 'organization_id required for super admin'}, status=400)
    else:
        organization = user.organization
    
    if report_type == 'inventory':
        return generate_asset_inventory_report(organization, format_type)
    elif report_type == 'risk':
        return generate_risk_summary_report(organization, format_type)
    elif report_type == 'vulnerabilities':
        return generate_vulnerability_report(organization, format_type)
    elif report_type == 'iso27001':
        return generate_iso27001_report(organization, format_type)
    elif report_type == 'pci_dss':
        return generate_pci_dss_report(organization, format_type)
    elif report_type == 'sbp':
        return generate_sbp_report(organization, format_type)
    else:
        return Response({'error': 'Invalid report type'}, status=400)


class ScheduledReportListView(generics.ListCreateAPIView):
    """
    List and create scheduled reports.
    - Viewers: Read-only (can only list)
    - Users and above: Can create scheduled reports
    """
    serializer_class = ScheduledReportSerializer
    permission_classes = [IsViewerOrAbove]
    
    def get_queryset(self):
        """Get scheduled reports for user's organization."""
        user = self.request.user
        if user.role == 'super_admin':
            return ScheduledReport.objects.all()
        return ScheduledReport.objects.filter(organization=user.organization)
    
    def perform_create(self, serializer):
        """Create scheduled report."""
        # Check if viewer (read-only)
        if self.request.user.role == 'viewer':
            from rest_framework import serializers as drf_serializers
            raise drf_serializers.ValidationError({
                'error': 'Viewers have read-only access. Cannot create scheduled reports.'
            })
        
        user = self.request.user
        if user.role == 'super_admin':
            org_id = self.request.data.get('organization')
            if org_id:
                org = Organization.objects.get(id=org_id)
            else:
                return Response({'error': 'organization required'}, status=400)
        else:
            org = user.organization
        
        # Calculate next run time
        frequency = serializer.validated_data.get('frequency')
        now = timezone.now()
        if frequency == 'daily':
            next_run = now + timedelta(days=1)
        elif frequency == 'weekly':
            next_run = now + timedelta(weeks=1)
        elif frequency == 'monthly':
            next_run = now + timedelta(days=30)
        else:
            next_run = now + timedelta(days=1)
        
        serializer.save(organization=org, created_by=user, next_run=next_run)


class ScheduledReportDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Scheduled report detail view.
    - Viewers: Read-only (can only retrieve)
    - Users and above: Can update/delete
    """
    serializer_class = ScheduledReportSerializer
    permission_classes = [IsViewerOrAbove]
    
    def get_queryset(self):
        """Get scheduled reports for user's organization."""
        user = self.request.user
        if user.role == 'super_admin':
            return ScheduledReport.objects.all()
        return ScheduledReport.objects.filter(organization=user.organization)
    
    def update(self, request, *args, **kwargs):
        """Update scheduled report - viewers cannot update."""
        if request.user.role == 'viewer':
            from rest_framework.response import Response
            from rest_framework import status
            return Response(
                {'error': 'Viewers have read-only access. Cannot update scheduled reports.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Delete scheduled report - viewers cannot delete."""
        if request.user.role == 'viewer':
            from rest_framework.response import Response
            from rest_framework import status
            return Response(
                {'error': 'Viewers have read-only access. Cannot delete scheduled reports.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)
