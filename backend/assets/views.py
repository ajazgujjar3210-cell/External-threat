"""
Views for assets app.
"""
from rest_framework import generics, filters, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import serializers as drf_serializers
from rest_framework.exceptions import PermissionDenied
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Q, F
from django.db import transaction
from django.utils import timezone
from django.http import Http404
from datetime import timedelta
from .models import Asset, AssetChange, Ownership, AssetMetadata, AssetCategory, OwnershipHistory, AlertConfiguration, AlertRule
from .domain_utils import extract_domain, group_assets_by_domain, get_domain_hierarchy
from .relationship_utils import get_asset_network_graph
from .serializers import (
    AssetSerializer, AssetChangeSerializer,
    OwnershipSerializer, AssetMetadataSerializer, AssetCategorySerializer,
    OwnershipHistorySerializer, AlertConfigurationSerializer, AlertRuleSerializer
)
from accounts.permissions import IsViewerOrAbove, IsUserOrAbove, IsViewerReadOnly
from accounts.models import Organization
from scans.models import ScanRun
from scans.tasks import run_discovery_scan
from vulnerabilities.models import Vulnerability
from risk_engine.models import RiskScore


class AssetListView(generics.ListCreateAPIView):
    """
    List and create assets.
    - Viewers: Read-only (can only list)
    - Users and above: Can create assets
    """
    serializer_class = AssetSerializer
    permission_classes = [IsViewerOrAbove]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['asset_type', 'is_active', 'is_unknown', 'sensitivity', 'function', 'criticality']
    search_fields = ['name']
    ordering_fields = ['name', 'first_seen', 'last_seen']
    ordering = ['-last_seen']
    
    def get_queryset(self):
        """Get assets for user's organization."""
        user = self.request.user
        if user.role == 'super_admin':
            org_id = self.request.query_params.get('organization_id')
            if org_id:
                return Asset.objects.filter(organization_id=org_id)
            return Asset.objects.all()
        return Asset.objects.filter(organization=user.organization)
    
    def perform_create(self, serializer):
        """Create asset in user's organization."""
        # Check if viewer (read-only)
        if self.request.user.role == 'viewer':
            raise drf_serializers.ValidationError({
                'error': 'Viewers have read-only access. Cannot create assets.'
            })
        
        user = self.request.user
        if user.role == 'super_admin':
            org_id = self.request.data.get('organization')
            if org_id:
                try:
                    org = Organization.objects.get(id=org_id)
                except Organization.DoesNotExist:
                    raise drf_serializers.ValidationError({'organization': 'Organization not found'})
            else:
                # For super admin without org, create or get default org
                org, created = Organization.objects.get_or_create(
                    name='Default Organization',
                    defaults={'status': 'active'}
                )
        else:
            if not user.organization:
                raise drf_serializers.ValidationError({'error': 'User must belong to an organization'})
            org = user.organization
        
        # Check for duplicate asset
        existing = Asset.objects.filter(
            organization=org,
            name=serializer.validated_data['name'],
            asset_type=serializer.validated_data['asset_type']
        ).first()
        
        if existing:
            raise drf_serializers.ValidationError({
                'name': f'Asset with this name and type already exists in this organization'
            })
        
        asset = serializer.save(organization=org, discovery_source='manual', is_unknown=True)
        
        # Create asset change record
        AssetChange.objects.create(
            asset=asset,
            change_type='new'
        )
        
        # Send alert for unknown asset
        from scans.alerts import alert_new_asset
        try:
            change = AssetChange.objects.filter(asset=asset, change_type='new').first()
            if change:
                alert_new_asset(change)
        except:
            pass


class AssetDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Asset detail view.
    - Viewers: Read-only (can only retrieve)
    - Users and above: Can update/delete
    """
    serializer_class = AssetSerializer
    permission_classes = [IsViewerOrAbove]
    
    def get_queryset(self):
        """Get assets for user's organization."""
        user = self.request.user
        if user.role == 'super_admin':
            return Asset.objects.all()
        return Asset.objects.filter(organization=user.organization)
    
    def update(self, request, *args, **kwargs):
        """Update asset - viewers cannot update."""
        if request.user.role == 'viewer':
            return Response(
                {'error': 'Viewers have read-only access. Cannot update assets.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Delete asset - viewers cannot delete."""
        if request.user.role == 'viewer':
            return Response(
                {'error': 'Viewers have read-only access. Cannot delete assets.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)


@api_view(['POST'])
@permission_classes([IsUserOrAbove])  # Viewers cannot trigger scans
def trigger_discovery_scan(request):
    """Trigger a discovery scan. Viewers cannot execute scans."""
    user = request.user
    
    if user.role == 'super_admin':
        org_id = request.data.get('organization_id')
        if org_id:
            organization = Organization.objects.get(id=org_id)
        else:
            # For super admin without org, create or get default org
            organization, created = Organization.objects.get_or_create(
                name='Default Organization',
                defaults={'status': 'active'}
            )
    else:
        if not user.organization:
            return Response({'error': 'User must belong to an organization'}, status=400)
        organization = user.organization
    
    domain = request.data.get('domain')
    if not domain:
        return Response({'error': 'domain is required'}, status=400)
    
    # Optional parameters for enhanced discovery
    enable_port_scan = request.data.get('enable_port_scan', False)
    enable_service_detection = request.data.get('enable_service_detection', False)
    
    # Create scan run with full configuration
    scan_run = ScanRun.objects.create(
        organization=organization,
        scan_type='discovery',
        status='pending',
        config={
            'domain': domain,
            'enable_port_scan': enable_port_scan,
            'enable_service_detection': enable_service_detection
        }
    )
    
    # Trigger async task AFTER database transaction commits
    # This ensures the ScanRun exists in DB before Celery tries to fetch it
    transaction.on_commit(
        lambda: run_discovery_scan.delay(
            str(scan_run.id), 
            str(organization.id), 
            domain,
            enable_port_scan=enable_port_scan,
            enable_service_detection=enable_service_detection
        )
    )
    
    return Response({
        'message': 'Discovery scan started',
        'scan_run_id': str(scan_run.id),
        'status': 'pending'
    })


@api_view(['GET'])
@permission_classes([IsViewerOrAbove])
def asset_changes(request):
    """Get asset changes."""
    user = request.user
    queryset = AssetChange.objects.all()
    
    if user.role != 'super_admin':
        queryset = queryset.filter(asset__organization=user.organization)
    
    # Filter by change type if provided
    change_type = request.query_params.get('change_type')
    if change_type:
        queryset = queryset.filter(change_type=change_type)
    
    # Order by timestamp descending FIRST (before slicing)
    queryset = queryset.order_by('-timestamp')
    
    # Support limit parameter (apply AFTER ordering)
    limit = request.query_params.get('limit')
    if limit:
        try:
            limit = int(limit)
            queryset = queryset[:limit]
        except ValueError:
            queryset = queryset[:100]
    else:
        queryset = queryset[:100]  # Default limit to 100
    
    serializer = AssetChangeSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsViewerOrAbove])
def unknown_assets(request):
    """Get unknown/unmanaged assets."""
    user = request.user
    queryset = Asset.objects.filter(is_unknown=True)
    
    if user.role != 'super_admin':
        queryset = queryset.filter(organization=user.organization)
    
    serializer = AssetSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsViewerOrAbove])
def mark_asset_known(request, asset_id):
    """Mark an asset as known/managed."""
    user = request.user
    try:
        asset = Asset.objects.get(id=asset_id)
        if user.role != 'super_admin' and asset.organization != user.organization:
            return Response({'error': 'Permission denied'}, status=403)
        
        asset.is_unknown = False
        asset.save()
        
        return Response({'message': 'Asset marked as known'})
    except Asset.DoesNotExist:
        return Response({'error': 'Asset not found'}, status=404)


class AssetCategoryListView(generics.ListCreateAPIView):
    """List and create asset categories."""
    serializer_class = AssetCategorySerializer
    permission_classes = [IsViewerOrAbove]
    
    def get_queryset(self):
        """Get categories for user's organization."""
        user = self.request.user
        if user.role == 'super_admin':
            org_id = self.request.query_params.get('organization_id')
            if org_id:
                return AssetCategory.objects.filter(organization_id=org_id)
            return AssetCategory.objects.all()
        return AssetCategory.objects.filter(organization=user.organization)
    
    def perform_create(self, serializer):
        """Create category in user's organization."""
        user = self.request.user
        if user.role == 'super_admin':
            org_id = self.request.data.get('organization')
            if org_id:
                org = Organization.objects.get(id=org_id)
            else:
                raise Response({'error': 'organization required'}, status=400)
        else:
            org = user.organization
        
        serializer.save(organization=org)


class AssetCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Asset category detail view."""
    serializer_class = AssetCategorySerializer
    permission_classes = [IsViewerOrAbove]
    
    def get_queryset(self):
        """Get categories for user's organization."""
        user = self.request.user
        if user.role == 'super_admin':
            return AssetCategory.objects.all()
        return AssetCategory.objects.filter(organization=user.organization)


class OwnershipView(generics.RetrieveUpdateAPIView):
    """Ownership view."""
    serializer_class = OwnershipSerializer
    permission_classes = [IsViewerOrAbove]
    
    def get_queryset(self):
        """Get ownership for user's organization."""
        user = self.request.user
        if user.role == 'super_admin':
            return Ownership.objects.all()
        return Ownership.objects.filter(asset__organization=user.organization)
    
    def get_object(self):
        """Get or create ownership for the asset."""
        asset_id = self.kwargs.get('pk')
        try:
            asset = Asset.objects.get(id=asset_id)
        except Asset.DoesNotExist:
            raise Http404("Asset not found")
        
        # Check permissions
        user = self.request.user
        if user.role != 'super_admin' and asset.organization != user.organization:
            raise PermissionDenied("You don't have permission to access this asset")
        
        # Get or create ownership
        ownership, created = Ownership.objects.get_or_create(asset=asset)
        return ownership
    
    def update(self, request, *args, **kwargs):
        """Update ownership, creating if it doesn't exist, and track history."""
        ownership = self.get_object()
        
        # Store old values for history
        old_department = ownership.department
        old_owner_name = ownership.owner_name
        old_owner_email = ownership.owner_email
        
        serializer = self.get_serializer(ownership, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        # Create history record if values changed
        new_department = ownership.department
        new_owner_name = ownership.owner_name
        new_owner_email = ownership.owner_email
        
        if (old_department != new_department or 
            old_owner_name != new_owner_name or 
            old_owner_email != new_owner_email):
            OwnershipHistory.objects.create(
                asset=ownership.asset,
                changed_by=request.user,
                old_department=old_department,
                new_department=new_department,
                old_owner_name=old_owner_name,
                new_owner_name=new_owner_name,
                old_owner_email=old_owner_email,
                new_owner_email=new_owner_email,
                change_reason=request.data.get('change_reason', '')
            )
        
        return Response(serializer.data)


class OwnershipHistoryListView(generics.ListAPIView):
    """List ownership history for an asset."""
    serializer_class = OwnershipHistorySerializer
    permission_classes = [IsViewerOrAbove]
    
    def get_queryset(self):
        """Get ownership history for user's organization."""
        user = self.request.user
        asset_id = self.kwargs.get('asset_id')
        
        queryset = OwnershipHistory.objects.filter(asset_id=asset_id)
        
        if user.role != 'super_admin':
            queryset = queryset.filter(asset__organization=user.organization)
        
        return queryset.order_by('-changed_at')


class AssetMetadataView(generics.RetrieveUpdateAPIView):
    """Asset metadata view."""
    serializer_class = AssetMetadataSerializer
    permission_classes = [IsViewerOrAbove]
    
    def get_queryset(self):
        """Get metadata for user's organization."""
        user = self.request.user
        if user.role == 'super_admin':
            return AssetMetadata.objects.all()
        return AssetMetadata.objects.filter(asset__organization=user.organization)


@api_view(['GET'])
@permission_classes([IsViewerOrAbove])
def dashboard_stats(request):
    """Get comprehensive dashboard statistics with all chart data in a single API call."""
    import logging
    from decimal import Decimal
    from scans.models import ScanRun
    
    logger = logging.getLogger(__name__)
    
    try:
        user = request.user
        
        # Base querysets filtered by organization
        if user.role == 'super_admin':
            org_id = request.query_params.get('organization_id')
            if org_id:
                assets_qs = Asset.objects.filter(organization_id=org_id)
                vulns_qs = Vulnerability.objects.filter(asset__organization_id=org_id)
                risks_qs = RiskScore.objects.filter(vulnerability__asset__organization_id=org_id)
                changes_qs = AssetChange.objects.filter(asset__organization_id=org_id)
                scans_qs = ScanRun.objects.filter(organization_id=org_id)
            else:
                assets_qs = Asset.objects.all()
                vulns_qs = Vulnerability.objects.all()
                risks_qs = RiskScore.objects.all()
                changes_qs = AssetChange.objects.all()
                scans_qs = ScanRun.objects.all()
        else:
            if not user.organization:
                return Response({'error': 'User must belong to an organization'}, status=400)
            assets_qs = Asset.objects.filter(organization=user.organization)
            vulns_qs = Vulnerability.objects.filter(asset__organization=user.organization)
            risks_qs = RiskScore.objects.filter(vulnerability__asset__organization=user.organization)
            changes_qs = AssetChange.objects.filter(asset__organization=user.organization)
            scans_qs = ScanRun.objects.filter(organization=user.organization)
        
        # Calculate statistics using database aggregations (fast!)
        # Count exposed assets (assets with vulnerabilities)
        exposed_assets_count = vulns_qs.values('asset_id').distinct().count()
        
        stats = {
            'total_assets': assets_qs.count(),
            'unknown_assets': assets_qs.filter(is_unknown=True).count(),
            'known_assets': assets_qs.filter(is_unknown=False).count(),
            'exposed_assets': exposed_assets_count,
            'active_assets': assets_qs.filter(is_active=True).count(),
            'total_vulnerabilities': vulns_qs.count(),
            'critical_vulnerabilities': vulns_qs.filter(severity='critical').count(),
            'high_vulnerabilities': vulns_qs.filter(severity='high').count(),
            'medium_vulnerabilities': vulns_qs.filter(severity='medium').count(),
            'low_vulnerabilities': vulns_qs.filter(severity='low').count(),
        }
        
        # Risk scores - handle DecimalField properly
        try:
            stats['high_risk_assets'] = risks_qs.filter(score__gte=Decimal('80.00')).count()
            stats['medium_risk_assets'] = risks_qs.filter(score__gte=Decimal('50.00'), score__lt=Decimal('80.00')).count()
            stats['low_risk_assets'] = risks_qs.filter(score__lt=Decimal('50.00')).count()
        except Exception:
            stats['high_risk_assets'] = 0
            stats['medium_risk_assets'] = 0
            stats['low_risk_assets'] = 0
        
        # ============ ASSETS DATA FOR CHARTS ============
        # Full assets list for AssetDiscoveryChart and ExposureMetricsChart
        from .serializers import AssetSerializer
        assets_list = list(assets_qs.values('id', 'name', 'asset_type', 'is_unknown', 'is_active', 'first_seen', 'last_seen'))
        stats['assets'] = assets_list
        
        # Assets by type (aggregated for quick access)
        try:
            assets_by_type = assets_qs.values('asset_type').annotate(count=Count('id')).order_by('-count')
            stats['assets_by_type'] = {item['asset_type']: item['count'] for item in assets_by_type if item['asset_type']}
        except Exception:
            stats['assets_by_type'] = {}
        
        # ============ VULNERABILITIES DATA FOR CHARTS ============
        # Full vulnerabilities list for VulnerabilityTrendChart and TopVulnerabilitiesChart
        vulns_list = list(vulns_qs.values(
            'id', 'title', 'severity', 'cvss', 'status', 'category',
            'detected_at', 'asset_id'
        ).order_by('-cvss')[:100])  # Top 100 by CVSS
        stats['vulnerabilities'] = vulns_list
        
        # Vulnerabilities by severity (aggregated)
        try:
            vulns_by_severity = vulns_qs.values('severity').annotate(count=Count('id')).order_by('-count')
            stats['vulnerabilities_by_severity'] = {item['severity']: item['count'] for item in vulns_by_severity if item['severity']}
        except Exception:
            stats['vulnerabilities_by_severity'] = {}
        
        # ============ RISKS DATA FOR CHARTS ============
        # Full risks list for RiskDistributionChart
        risks_list = list(risks_qs.values(
            'id', 'score', 'vulnerability_id'
        ).order_by('-score')[:100])  # Top 100 risks
        # Convert Decimal to float for JSON serialization
        for risk in risks_list:
            if risk.get('score') is not None:
                risk['score'] = float(risk['score'])
        stats['risks'] = risks_list
        
        # Risk distribution (aggregated)
        try:
            all_risks = list(risks_qs.values('score'))
            risk_distribution = {'critical': 0, 'high': 0, 'medium': 0, 'low': 0}
            for risk in all_risks:
                try:
                    score = float(risk['score']) if risk['score'] is not None else 0
                    if score >= 80:
                        risk_distribution['critical'] += 1
                    elif score >= 60:
                        risk_distribution['high'] += 1
                    elif score >= 40:
                        risk_distribution['medium'] += 1
                    else:
                        risk_distribution['low'] += 1
                except (ValueError, TypeError):
                    continue
            stats['risk_distribution'] = risk_distribution
        except Exception:
            stats['risk_distribution'] = {'critical': 0, 'high': 0, 'medium': 0, 'low': 0}
        
        # ============ RECENT CHANGES ============
        try:
            recent_changes = changes_qs.order_by('-timestamp')[:10]
            changes_serializer = AssetChangeSerializer(recent_changes, many=True)
            stats['recent_changes'] = changes_serializer.data
        except Exception:
            stats['recent_changes'] = []
        
        # ============ VULNERABILITY TRENDS (Last 30 days) ============
        try:
            thirty_days_ago = timezone.now() - timedelta(days=30)
            recent_vulns = list(vulns_qs.filter(detected_at__gte=thirty_days_ago).values('detected_at', 'severity'))
            
            # Format trends data by day
            trends_by_day = {}
            for vuln in recent_vulns:
                try:
                    detected_at = vuln['detected_at']
                    if isinstance(detected_at, str):
                        day_str = detected_at.split('T')[0]
                    elif hasattr(detected_at, 'date'):
                        day_str = detected_at.date().isoformat()
                    else:
                        day_str = str(detected_at).split('T')[0] if 'T' in str(detected_at) else str(detected_at)
                    
                    if day_str not in trends_by_day:
                        trends_by_day[day_str] = {'critical': 0, 'high': 0, 'medium': 0, 'low': 0}
                    severity = vuln.get('severity') or 'low'
                    if severity in trends_by_day[day_str]:
                        trends_by_day[day_str][severity] += 1
                except (ValueError, TypeError, AttributeError):
                    continue
            stats['vulnerability_trends'] = trends_by_day
        except Exception:
            stats['vulnerability_trends'] = {}
        
        # ============ ASSET DISCOVERY TRENDS (Last 30 days) ============
        try:
            thirty_days_ago = timezone.now() - timedelta(days=30)
            recent_assets = list(assets_qs.filter(first_seen__gte=thirty_days_ago).values('first_seen', 'asset_type'))
            
            # Format trends data by day
            asset_trends_by_day = {}
            for asset in recent_assets:
                try:
                    first_seen = asset['first_seen']
                    if isinstance(first_seen, str):
                        day_str = first_seen.split('T')[0]
                    elif hasattr(first_seen, 'date'):
                        day_str = first_seen.date().isoformat()
                    else:
                        day_str = str(first_seen).split('T')[0] if 'T' in str(first_seen) else str(first_seen)
                    
                    if day_str not in asset_trends_by_day:
                        asset_trends_by_day[day_str] = 0
                    asset_trends_by_day[day_str] += 1
                except (ValueError, TypeError, AttributeError):
                    continue
            stats['asset_discovery_trends'] = asset_trends_by_day
        except Exception:
            stats['asset_discovery_trends'] = {}
        
        # ============ RECENT SCANS ============
        try:
            from scans.serializers import ScanRunSerializer
            recent_scans = scans_qs.order_by('-started_at')[:5]
            scans_serializer = ScanRunSerializer(recent_scans, many=True)
            stats['recent_scans'] = scans_serializer.data
            
            # Scan statistics
            stats['total_scans'] = scans_qs.count()
            stats['completed_scans'] = scans_qs.filter(status='completed').count()
            stats['running_scans'] = scans_qs.filter(status='running').count()
            stats['failed_scans'] = scans_qs.filter(status='failed').count()
        except Exception:
            stats['recent_scans'] = []
            stats['total_scans'] = 0
            stats['completed_scans'] = 0
            stats['running_scans'] = 0
            stats['failed_scans'] = 0
        
        # ============ TOP VULNERABILITIES BY CVSS ============
        try:
            top_vulns = list(vulns_qs.values(
                'id', 'title', 'severity', 'cvss', 'status', 'asset_id'
            ).order_by('-cvss')[:10])
            # Convert Decimal cvss to float
            for vuln in top_vulns:
                if vuln.get('cvss') is not None:
                    vuln['cvss'] = float(vuln['cvss'])
            stats['top_vulnerabilities'] = top_vulns
        except Exception:
            stats['top_vulnerabilities'] = []
        
        # ============ EXPOSURE METRICS ============
        try:
            stats['exposure_metrics'] = {
                'total_assets': stats['total_assets'],
                'exposed_assets': exposed_assets_count,
                'unknown_assets': stats['unknown_assets'],
                'known_safe_assets': stats['known_assets'] - exposed_assets_count if stats['known_assets'] > exposed_assets_count else 0,
                'exposure_rate': round((exposed_assets_count / stats['total_assets'] * 100), 2) if stats['total_assets'] > 0 else 0
            }
        except Exception:
            stats['exposure_metrics'] = {
                'total_assets': 0,
                'exposed_assets': 0,
                'unknown_assets': 0,
                'known_safe_assets': 0,
                'exposure_rate': 0
            }
        
        return Response(stats)
        
    except Exception as e:
        logger.error(f'Dashboard stats error: {str(e)}', exc_info=True)
        return Response({
            'error': 'Failed to fetch dashboard statistics',
            'total_assets': 0,
            'total_vulnerabilities': 0,
            'critical_vulnerabilities': 0,
            'high_risk_assets': 0,
            'unknown_assets': 0,
            'known_assets': 0,
            'exposed_assets': 0,
            'assets': [],
            'vulnerabilities': [],
            'risks': [],
            'assets_by_type': {},
            'vulnerabilities_by_severity': {},
            'recent_changes': [],
            'vulnerability_trends': {},
            'asset_discovery_trends': {},
            'risk_distribution': {'critical': 0, 'high': 0, 'medium': 0, 'low': 0},
            'recent_scans': [],
            'top_vulnerabilities': [],
            'exposure_metrics': {'total_assets': 0, 'exposed_assets': 0, 'unknown_assets': 0, 'known_safe_assets': 0, 'exposure_rate': 0},
        }, status=500)


@api_view(['GET'])
@permission_classes([IsViewerOrAbove])
def asset_notifications(request):
    """Get asset change notifications."""
    user = request.user
    queryset = AssetChange.objects.all()
    
    if user.role != 'super_admin':
        queryset = queryset.filter(asset__organization=user.organization)
    
    # Filter by change type if provided
    change_type = request.query_params.get('change_type')
    if change_type:
        queryset = queryset.filter(change_type=change_type)
    
    # Order by timestamp descending
    queryset = queryset.order_by('-timestamp')
    
    # Support limit parameter
    limit = request.query_params.get('limit')
    if limit:
        try:
            limit = int(limit)
            queryset = queryset[:limit]
        except ValueError:
            queryset = queryset[:100]
    else:
        queryset = queryset[:100]  # Default limit to 100
    
    serializer = AssetChangeSerializer(queryset, many=True)
    return Response({
        'results': serializer.data,
        'count': len(serializer.data)
    })


@api_view(['GET'])
@permission_classes([IsViewerOrAbove])
def asset_notifications_unread_count(request):
    """Get count of unread asset change notifications."""
    user = request.user
    queryset = AssetChange.objects.all()
    
    if user.role != 'super_admin':
        queryset = queryset.filter(asset__organization=user.organization)
    
    # Count recent changes (last 24 hours) as "unread"
    # You can customize this logic based on your requirements
    from datetime import timedelta
    recent_cutoff = timezone.now() - timedelta(hours=24)
    unread_count = queryset.filter(timestamp__gte=recent_cutoff).count()
    
    return Response({
        'count': unread_count
    })


@api_view(['GET'])
@permission_classes([IsViewerOrAbove])
def export_change_logs(request):
    """Export change logs in CSV or JSON format."""
    import csv
    from django.http import HttpResponse
    
    user = request.user
    format_type = request.query_params.get('format', 'json').lower()
    
    # Get change logs
    queryset = AssetChange.objects.all()
    
    if user.role != 'super_admin':
        queryset = queryset.filter(asset__organization=user.organization)
    
    # Apply filters
    change_type = request.query_params.get('change_type')
    if change_type:
        queryset = queryset.filter(change_type=change_type)
    
    # Date range filter
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    if start_date:
        queryset = queryset.filter(timestamp__gte=start_date)
    if end_date:
        queryset = queryset.filter(timestamp__lte=end_date)
    
    queryset = queryset.order_by('-timestamp')
    
    if format_type == 'csv':
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="change_logs.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['Timestamp', 'Asset Name', 'Asset Type', 'Change Type', 'Details'])
        
        for change in queryset:
            writer.writerow([
                change.timestamp.isoformat(),
                change.asset.name,
                change.asset.asset_type,
                change.get_change_type_display(),
                str(change.details)
            ])
        
        return response
    
    else:  # JSON format
        serializer = AssetChangeSerializer(queryset, many=True)
        return Response({
            'format': 'json',
            'count': len(serializer.data),
            'data': serializer.data
        })


@api_view(['GET'])
@permission_classes([IsViewerOrAbove])
def domain_groups(request):
    """Get assets grouped by domain."""
    user = request.user
    
    # Get assets
    queryset = Asset.objects.all()
    if user.role != 'super_admin':
        queryset = queryset.filter(organization=user.organization)
    
    # Apply filters
    asset_type = request.query_params.get('asset_type')
    if asset_type:
        queryset = queryset.filter(asset_type=asset_type)
    
    is_active = request.query_params.get('is_active')
    if is_active is not None:
        queryset = queryset.filter(is_active=is_active.lower() == 'true')
    
    # Group by domain
    domain_groups_dict = group_assets_by_domain(queryset)
    
    # Format response
    result = []
    for domain, assets in domain_groups_dict.items():
        if domain == '_no_domain':
            continue
        
        asset_types = {}
        for asset in assets:
            asset_type = asset.asset_type
            if asset_type not in asset_types:
                asset_types[asset_type] = 0
            asset_types[asset_type] += 1
        
        result.append({
            'domain': domain,
            'asset_count': len(assets),
            'asset_types': asset_types,
            'assets': AssetSerializer(assets, many=True).data[:10]  # Limit to 10 for preview
        })
    
    # Sort by asset count descending
    result.sort(key=lambda x: x['asset_count'], reverse=True)
    
    return Response({
        'domains': result,
        'total_domains': len(result),
        'total_assets': queryset.count()
    })


@api_view(['GET'])
@permission_classes([IsViewerOrAbove])
def domain_hierarchy(request):
    """Get domain hierarchy with parent-child relationships."""
    user = request.user
    
    # Get assets
    queryset = Asset.objects.all()
    if user.role != 'super_admin':
        queryset = queryset.filter(organization=user.organization)
    
    # Build hierarchy
    hierarchy = get_domain_hierarchy(queryset)
    
    return Response({
        'hierarchy': hierarchy,
        'total_domains': len(hierarchy)
    })


@api_view(['GET'])
@permission_classes([IsViewerOrAbove])
def asset_network_graph(request):
    """Get asset relationship network graph for visualization."""
    user = request.user
    
    # Get organization ID
    organization_id = None
    if user.role == 'super_admin':
        organization_id = request.query_params.get('organization_id')
    else:
        if user.organization:
            organization_id = str(user.organization.id)
    
    # Get network graph
    graph = get_asset_network_graph(organization_id)
    
    return Response({
        'graph': graph,
        'node_count': len(graph['nodes']),
        'edge_count': len(graph['edges']),
        'group_count': len(graph['groups'])
    })


class AlertConfigurationView(generics.RetrieveUpdateAPIView):
    """Alert configuration view."""
    serializer_class = AlertConfigurationSerializer
    permission_classes = [IsUserOrAbove]  # Only users and above can configure alerts
    
    def get_object(self):
        """Get or create alert configuration for organization."""
        user = self.request.user
        if user.role == 'super_admin':
            org_id = self.request.query_params.get('organization_id')
            if org_id:
                organization = Organization.objects.get(id=org_id)
            else:
                raise Http404("organization_id required for super admin")
        else:
            if not user.organization:
                raise Http404("User must belong to an organization")
            organization = user.organization
        
        config, created = AlertConfiguration.objects.get_or_create(
            organization=organization,
            defaults={
                'enabled': True,
                'email_enabled': True,
                'notify_on_low': False,
                'notify_on_medium': True,
                'notify_on_high': True,
                'notify_on_critical': True
            }
        )
        return config


class AlertRuleListView(generics.ListCreateAPIView):
    """Alert rule list and create view."""
    serializer_class = AlertRuleSerializer
    permission_classes = [IsUserOrAbove]
    
    def get_queryset(self):
        """Get alert rules for user's organization."""
        user = self.request.user
        if user.role == 'super_admin':
            org_id = self.request.query_params.get('organization_id')
            if org_id:
                return AlertRule.objects.filter(organization_id=org_id)
            return AlertRule.objects.all()
        return AlertRule.objects.filter(organization=user.organization)
    
    def perform_create(self, serializer):
        """Create alert rule in user's organization."""
        if self.request.user.role == 'viewer':
            raise drf_serializers.ValidationError({
                'error': 'Viewers have read-only access. Cannot create alert rules.'
            })
        
        user = self.request.user
        if user.role == 'super_admin':
            org_id = self.request.data.get('organization')
            if org_id:
                organization = Organization.objects.get(id=org_id)
            else:
                raise drf_serializers.ValidationError({'organization': 'Organization required for super admin'})
        else:
            if not user.organization:
                raise drf_serializers.ValidationError({'error': 'User must belong to an organization'})
            organization = user.organization
        
        serializer.save(organization=organization)


class AlertRuleDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Alert rule detail view."""
    serializer_class = AlertRuleSerializer
    permission_classes = [IsUserOrAbove]
    
    def get_queryset(self):
        """Get alert rules for user's organization."""
        user = self.request.user
        if user.role == 'super_admin':
            return AlertRule.objects.all()
        return AlertRule.objects.filter(organization=user.organization)
    
    def update(self, request, *args, **kwargs):
        """Update alert rule - viewers cannot update."""
        if request.user.role == 'viewer':
            return Response(
                {'error': 'Viewers have read-only access. Cannot update alert rules.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Delete alert rule - viewers cannot delete."""
        if request.user.role == 'viewer':
            return Response(
                {'error': 'Viewers have read-only access. Cannot delete alert rules.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)
