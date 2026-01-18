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
from django.utils import timezone
from django.http import Http404
from datetime import timedelta
from .models import Asset, AssetChange, Ownership, AssetMetadata, AssetCategory
from .serializers import (
    AssetSerializer, AssetChangeSerializer,
    OwnershipSerializer, AssetMetadataSerializer, AssetCategorySerializer
)
from accounts.permissions import IsViewerOrAbove
from accounts.models import Organization
from scans.models import ScanRun
from scans.tasks import run_discovery_scan
from vulnerabilities.models import Vulnerability
from risk_engine.models import RiskScore


class AssetListView(generics.ListCreateAPIView):
    """List and create assets."""
    serializer_class = AssetSerializer
    permission_classes = [IsViewerOrAbove]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['asset_type', 'is_active', 'is_unknown', 'sensitivity', 'function']
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
    """Asset detail view."""
    serializer_class = AssetSerializer
    permission_classes = [IsViewerOrAbove]
    
    def get_queryset(self):
        """Get assets for user's organization."""
        user = self.request.user
        if user.role == 'super_admin':
            return Asset.objects.all()
        return Asset.objects.filter(organization=user.organization)


@api_view(['POST'])
@permission_classes([IsViewerOrAbove])
def trigger_discovery_scan(request):
    """Trigger a discovery scan."""
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
    
    # Create scan run
    scan_run = ScanRun.objects.create(
        organization=organization,
        scan_type='discovery',
        status='pending',
        config={'domain': domain}
    )
    
    # Trigger async task with enhanced discovery options
    run_discovery_scan.delay(
        str(scan_run.id), 
        str(organization.id), 
        domain,
        enable_port_scan=enable_port_scan,
        enable_service_detection=enable_service_detection
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
    
    # Order by timestamp descending
    queryset = queryset.order_by('-timestamp')
    
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
        """Update ownership, creating if it doesn't exist."""
        ownership = self.get_object()
        serializer = self.get_serializer(ownership, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


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
    """Get optimized dashboard statistics using database aggregations."""
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
            else:
                assets_qs = Asset.objects.all()
                vulns_qs = Vulnerability.objects.all()
                risks_qs = RiskScore.objects.all()
                changes_qs = AssetChange.objects.all()
        else:
            if not user.organization:
                return Response({'error': 'User must belong to an organization'}, status=400)
            assets_qs = Asset.objects.filter(organization=user.organization)
            vulns_qs = Vulnerability.objects.filter(asset__organization=user.organization)
            risks_qs = RiskScore.objects.filter(vulnerability__asset__organization=user.organization)
            changes_qs = AssetChange.objects.filter(asset__organization=user.organization)
        
        # Calculate statistics using database aggregations (fast!)
        try:
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
            
            # Risk scores - handle DecimalField properly (use Decimal for comparison)
            from decimal import Decimal
            try:
                stats['high_risk_assets'] = risks_qs.filter(score__gte=Decimal('80.00')).count()
                stats['medium_risk_assets'] = risks_qs.filter(score__gte=Decimal('50.00'), score__lt=Decimal('80.00')).count()
                stats['low_risk_assets'] = risks_qs.filter(score__lt=Decimal('50.00')).count()
            except Exception as e:
                # Fallback if risk scores query fails
                stats['high_risk_assets'] = 0
                stats['medium_risk_assets'] = 0
                stats['low_risk_assets'] = 0
            
            # Assets by type (for charts)
            try:
                assets_by_type = assets_qs.values('asset_type').annotate(count=Count('id')).order_by('-count')
                stats['assets_by_type'] = {item['asset_type']: item['count'] for item in assets_by_type}
            except Exception:
                stats['assets_by_type'] = {}
            
            # Vulnerabilities by severity (for charts)
            try:
                vulns_by_severity = vulns_qs.values('severity').annotate(count=Count('id')).order_by('-count')
                stats['vulnerabilities_by_severity'] = {item['severity']: item['count'] for item in vulns_by_severity}
            except Exception:
                stats['vulnerabilities_by_severity'] = {}
            
            # Recent changes (last 5)
            try:
                recent_changes = changes_qs.order_by('-timestamp')[:5]
                changes_serializer = AssetChangeSerializer(recent_changes, many=True)
                stats['recent_changes'] = changes_serializer.data
            except Exception:
                stats['recent_changes'] = []
            
            # Vulnerability trends (last 7 days) - using Python processing for database compatibility
            try:
                seven_days_ago = timezone.now() - timedelta(days=7)
                recent_vulns = list(vulns_qs.filter(detected_at__gte=seven_days_ago).values('detected_at', 'severity'))
                
                # Format trends data by day
                trends_by_day = {}
                for vuln in recent_vulns:
                    try:
                        # Extract date (database-agnostic)
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
                    except (ValueError, TypeError, AttributeError) as e:
                        continue
                stats['vulnerability_trends'] = trends_by_day
            except Exception as e:
                stats['vulnerability_trends'] = {}
            
            # Risk distribution (for charts) - using Python processing for database compatibility
            try:
                all_risks = list(risks_qs.values('score'))
                risk_distribution = {'high': 0, 'medium': 0, 'low': 0}
                for risk in all_risks:
                    try:
                        score = float(risk['score']) if risk['score'] is not None else 0
                        if score >= 80:
                            risk_distribution['high'] += 1
                        elif score >= 50:
                            risk_distribution['medium'] += 1
                        else:
                            risk_distribution['low'] += 1
                    except (ValueError, TypeError):
                        continue
                stats['risk_distribution'] = risk_distribution
            except Exception as e:
                stats['risk_distribution'] = {'high': 0, 'medium': 0, 'low': 0}
            
            return Response(stats)
        except Exception as e:
            # Log error and return basic response
            import logging
            logger = logging.getLogger(__name__)
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
                'assets_by_type': {},
                'vulnerabilities_by_severity': {},
                'recent_changes': [],
                'vulnerability_trends': {},
                'risk_distribution': {'high': 0, 'medium': 0, 'low': 0},
            }, status=500)
    except Exception as e:
        # Outer exception handler for any errors in the function
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f'Dashboard stats outer error: {str(e)}', exc_info=True)
        return Response({
            'error': 'Failed to fetch dashboard statistics',
            'total_assets': 0,
            'total_vulnerabilities': 0,
            'critical_vulnerabilities': 0,
            'high_risk_assets': 0,
            'unknown_assets': 0,
            'known_assets': 0,
            'exposed_assets': 0,
            'assets_by_type': {},
            'vulnerabilities_by_severity': {},
            'recent_changes': [],
            'vulnerability_trends': {},
            'risk_distribution': {'high': 0, 'medium': 0, 'low': 0},
        }, status=500)
