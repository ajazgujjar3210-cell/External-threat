"""
Views for scans app.
"""
from rest_framework import generics, status, serializers as drf_serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from .models import ScanRun, ScheduledDiscovery
from .serializers import ScanRunSerializer, ScheduledDiscoverySerializer
from .tasks import run_discovery_scan, run_port_scan, run_ssl_check
from accounts.permissions import IsViewerOrAbove, IsUserOrAbove
from accounts.models import Organization


class ScanRunListView(generics.ListCreateAPIView):
    """
    List and create scan runs.
    - Viewers: Read-only (can only list)
    - Users and above: Can create scan runs
    """
    serializer_class = ScanRunSerializer
    permission_classes = [IsViewerOrAbove]
    
    def get_queryset(self):
        """Get scan runs for user's organization."""
        user = self.request.user
        if user.role == 'super_admin':
            return ScanRun.objects.all()
        return ScanRun.objects.filter(organization=user.organization)
    
    def perform_create(self, serializer):
        """Create scan run and trigger task."""
        # Check if viewer (read-only)
        if self.request.user.role == 'viewer':
            raise drf_serializers.ValidationError({
                'error': 'Viewers have read-only access. Cannot create scan runs.'
            })
        
        user = self.request.user
        org = user.organization if user.role != 'super_admin' else serializer.validated_data.get('organization')
        
        if not org and user.role == 'super_admin':
            org_id = self.request.data.get('organization')
            if org_id:
                org = Organization.objects.get(id=org_id)
        
        scan_run = serializer.save(organization=org, status='pending')
        
        # Trigger appropriate scan task
        scan_type = serializer.validated_data.get('scan_type')
        if scan_type == 'discovery':
            domain = self.request.data.get('domain')
            run_discovery_scan.delay(str(scan_run.id), str(org.id), domain)
        elif scan_type == 'port':
            asset_id = self.request.data.get('asset_id')
            if asset_id:
                run_port_scan.delay(str(scan_run.id), asset_id)
        elif scan_type == 'ssl':
            asset_id = self.request.data.get('asset_id')
            if asset_id:
                run_ssl_check.delay(str(scan_run.id), asset_id)


class ScanRunDetailView(generics.RetrieveDestroyAPIView):
    """
    Scan run detail view with delete support.
    - Viewers: Read-only (can only retrieve)
    - Users and above: Can delete
    """
    serializer_class = ScanRunSerializer
    permission_classes = [IsViewerOrAbove]
    
    def get_queryset(self):
        """Get scan runs for user's organization."""
        user = self.request.user
        if user.role == 'super_admin':
            return ScanRun.objects.all()
        return ScanRun.objects.filter(organization=user.organization)
    
    def destroy(self, request, *args, **kwargs):
        """Delete scan run with validation."""
        # Check if viewer (read-only)
        if request.user.role == 'viewer':
            return Response(
                {'error': 'Viewers have read-only access. Cannot delete scan runs.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        instance = self.get_object()
        
        # Prevent deletion of running scans
        if instance.status == 'running':
            return Response(
                {'error': 'Cannot delete a scan that is currently running. Please wait for it to complete or stop it first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        self.perform_destroy(instance)
        return Response(
            {'message': 'Scan run deleted successfully'},
            status=status.HTTP_200_OK
        )


@api_view(['POST'])
@permission_classes([IsUserOrAbove])  # Viewers cannot stop scans
def stop_scan(request, scan_id):
    """Stop a running scan. Viewers cannot execute this action."""
    user = request.user
    
    try:
        if user.role == 'super_admin':
            scan = ScanRun.objects.get(id=scan_id)
        else:
            scan = ScanRun.objects.get(id=scan_id, organization=user.organization)
    except ScanRun.DoesNotExist:
        return Response(
            {'error': 'Scan not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Only running or pending scans can be stopped
    if scan.status not in ['running', 'pending']:
        return Response(
            {'error': f'Cannot stop a scan with status "{scan.status}". Only running or pending scans can be stopped.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Update scan status to stopped
    scan.status = 'stopped'
    scan.finished_at = timezone.now()
    scan.error_message = 'Scan was manually stopped by user'
    scan.save()
    
    return Response(
        {'message': 'Scan stopped successfully', 'status': 'stopped'},
        status=status.HTTP_200_OK
    )


class ScheduledDiscoveryListView(generics.ListCreateAPIView):
    """
    List and create scheduled discoveries.
    - Viewers: Read-only (can only list)
    - Users and above: Can create scheduled discoveries
    """
    serializer_class = ScheduledDiscoverySerializer
    permission_classes = [IsViewerOrAbove]
    
    def get_queryset(self):
        """Get scheduled discoveries for user's organization."""
        user = self.request.user
        if user.role == 'super_admin':
            return ScheduledDiscovery.objects.all()
        return ScheduledDiscovery.objects.filter(organization=user.organization)
    
    def perform_create(self, serializer):
        """Create scheduled discovery and calculate next run."""
        # Check if viewer (read-only)
        if self.request.user.role == 'viewer':
            raise drf_serializers.ValidationError({
                'error': 'Viewers have read-only access. Cannot create scheduled discoveries.'
            })
        
        user = self.request.user
        if user.role == 'super_admin':
            org_id = self.request.data.get('organization')
            if org_id:
                org = Organization.objects.get(id=org_id)
            else:
                org, created = Organization.objects.get_or_create(
                    name='Default Organization',
                    defaults={'status': 'active'}
                )
        else:
            if not user.organization:
                raise drf_serializers.ValidationError({'error': 'User must belong to an organization'})
            org = user.organization
        
        scheduled = serializer.save(organization=org, created_by=user)
        if scheduled.is_active and not scheduled.next_run:
            scheduled.next_run = scheduled.calculate_next_run()
            scheduled.save()
        return scheduled


class ScheduledDiscoveryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Scheduled discovery detail view.
    - Viewers: Read-only (can only retrieve)
    - Users and above: Can update/delete
    """
    serializer_class = ScheduledDiscoverySerializer
    permission_classes = [IsViewerOrAbove]
    
    def get_queryset(self):
        """Get scheduled discoveries for user's organization."""
        user = self.request.user
        if user.role == 'super_admin':
            return ScheduledDiscovery.objects.all()
        return ScheduledDiscovery.objects.filter(organization=user.organization)
    
    def update(self, request, *args, **kwargs):
        """Update scheduled discovery - viewers cannot update."""
        if request.user.role == 'viewer':
            return Response(
                {'error': 'Viewers have read-only access. Cannot update scheduled discoveries.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Delete scheduled discovery - viewers cannot delete."""
        if request.user.role == 'viewer':
            return Response(
                {'error': 'Viewers have read-only access. Cannot delete scheduled discoveries.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)
    
    def perform_update(self, serializer):
        """Update scheduled discovery and recalculate next run if needed."""
        instance = serializer.save()
        if instance.is_active and not instance.next_run:
            instance.next_run = instance.calculate_next_run()
            instance.save()
        elif not instance.is_active:
            instance.next_run = None
            instance.save()


@api_view(['GET'])
@permission_classes([IsViewerOrAbove])
def export_scan_results(request, scan_id):
    """Export scan results in CSV, JSON, or PDF format."""
    import csv
    import json
    from django.http import HttpResponse
    from io import StringIO
    
    user = request.user
    format_type = request.query_params.get('format', 'json').lower()
    
    try:
        if user.role == 'super_admin':
            scan = ScanRun.objects.get(id=scan_id)
        else:
            scan = ScanRun.objects.get(id=scan_id, organization=user.organization)
    except ScanRun.DoesNotExist:
        return Response(
            {'error': 'Scan not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    results = scan.results or {}
    config = scan.config or {}
    
    if format_type == 'csv':
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="scan_{scan.id}_{scan.scan_type}_results.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['Scan ID', scan.id])
        writer.writerow(['Scan Type', scan.scan_type])
        writer.writerow(['Status', scan.status])
        writer.writerow(['Started At', scan.started_at.isoformat() if scan.started_at else 'N/A'])
        writer.writerow(['Finished At', scan.finished_at.isoformat() if scan.finished_at else 'N/A'])
        writer.writerow([])
        
        # Write configuration
        writer.writerow(['Configuration'])
        for key, value in config.items():
            writer.writerow([key, str(value)])
        writer.writerow([])
        
        # Write results
        writer.writerow(['Results'])
        if 'assets' in results:
            writer.writerow(['Asset Name', 'Asset Type', 'Source', 'Metadata'])
            for asset in results.get('assets', []):
                metadata = json.dumps(asset.get('metadata', {}))
                writer.writerow([
                    asset.get('name', ''),
                    asset.get('type', ''),
                    asset.get('source', ''),
                    metadata
                ])
        else:
            # Generic results export
            for key, value in results.items():
                if isinstance(value, (dict, list)):
                    writer.writerow([key, json.dumps(value)])
                else:
                    writer.writerow([key, str(value)])
        
        return response
    
    elif format_type == 'pdf':
        # For PDF, we'll return JSON for now (PDF generation requires additional libraries)
        # In production, you'd use libraries like reportlab or weasyprint
        return Response({
            'error': 'PDF export not yet implemented. Please use CSV or JSON format.',
            'available_formats': ['csv', 'json']
        }, status=status.HTTP_400_BAD_REQUEST)
    
    else:  # JSON format
        return Response({
            'scan_id': str(scan.id),
            'scan_type': scan.scan_type,
            'status': scan.status,
            'started_at': scan.started_at.isoformat() if scan.started_at else None,
            'finished_at': scan.finished_at.isoformat() if scan.finished_at else None,
            'config': config,
            'results': results
        })
