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
from accounts.permissions import IsViewerOrAbove
from accounts.models import Organization


class ScanRunListView(generics.ListCreateAPIView):
    """List and create scan runs."""
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
    """Scan run detail view with delete support."""
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
@permission_classes([IsViewerOrAbove])
def stop_scan(request, scan_id):
    """Stop a running scan."""
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
    """List and create scheduled discoveries."""
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
    """Scheduled discovery detail view."""
    serializer_class = ScheduledDiscoverySerializer
    permission_classes = [IsViewerOrAbove]
    
    def get_queryset(self):
        """Get scheduled discoveries for user's organization."""
        user = self.request.user
        if user.role == 'super_admin':
            return ScheduledDiscovery.objects.all()
        return ScheduledDiscovery.objects.filter(organization=user.organization)
    
    def perform_update(self, serializer):
        """Update scheduled discovery and recalculate next run if needed."""
        instance = serializer.save()
        if instance.is_active and not instance.next_run:
            instance.next_run = instance.calculate_next_run()
            instance.save()
        elif not instance.is_active:
            instance.next_run = None
            instance.save()
