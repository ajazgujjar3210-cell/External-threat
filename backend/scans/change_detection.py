"""
Change detection logic for comparing scan runs.
"""
from django.utils import timezone
from assets.models import Asset, AssetChange
from vulnerabilities.models import Vulnerability
from scans.models import ScanRun


def detect_asset_changes(organization, previous_scan_run=None, current_scan_run=None):
    """
    Detect changes between two scan runs.
    
    Returns: dict with changes detected
    """
    changes = {
        'new_assets': [],
        'removed_assets': [],
        'status_changes': []
    }
    
    if not current_scan_run:
        return changes
    
    # Get assets from current scan
    current_assets = set(
        Asset.objects.filter(
            organization=organization,
            last_seen__gte=current_scan_run.started_at
        ).values_list('name', 'asset_type')
    )
    
    if previous_scan_run:
        # Get assets from previous scan
        previous_assets = set(
            Asset.objects.filter(
                organization=organization,
                last_seen__gte=previous_scan_run.started_at,
                last_seen__lt=current_scan_run.started_at
            ).values_list('name', 'asset_type')
        )
        
        # Find new assets
        new_assets = current_assets - previous_assets
        for asset_name, asset_type in new_assets:
            try:
                asset = Asset.objects.get(
                    organization=organization,
                    name=asset_name,
                    asset_type=asset_type
                )
                changes['new_assets'].append({
                    'name': asset_name,
                    'type': asset_type,
                    'id': str(asset.id)
                })
                
                # Create asset change record
                AssetChange.objects.create(
                    asset=asset,
                    change_type='new',
                    scan_run=current_scan_run
                )
            except Asset.DoesNotExist:
                pass
        
        # Find removed assets (assets that were active before but not seen now)
        removed_assets = previous_assets - current_assets
        for asset_name, asset_type in removed_assets:
            try:
                asset = Asset.objects.get(
                    organization=organization,
                    name=asset_name,
                    asset_type=asset_type
                )
                if asset.is_active:
                    asset.is_active = False
                    asset.save()
                    
                    changes['removed_assets'].append({
                        'name': asset_name,
                        'type': asset_type,
                        'id': str(asset.id)
                    })
                    
                    # Create asset change record
                    AssetChange.objects.create(
                        asset=asset,
                        change_type='removed',
                        scan_run=current_scan_run
                    )
            except Asset.DoesNotExist:
                pass
    
    return changes


def detect_critical_vulnerability_changes(organization, scan_run):
    """
    Detect new critical vulnerabilities.
    """
    new_critical = Vulnerability.objects.filter(
        asset__organization=organization,
        severity__in=['critical', 'high'],
        detected_at__gte=scan_run.started_at if scan_run else timezone.now() - timezone.timedelta(days=1),
        status='open'
    )
    
    return list(new_critical.values('id', 'title', 'severity', 'asset__name'))


def compare_scan_runs(organization, previous_scan_id=None, current_scan_id=None):
    """
    Compare two scan runs and return all changes.
    """
    previous_scan = ScanRun.objects.get(id=previous_scan_id) if previous_scan_id else None
    current_scan = ScanRun.objects.get(id=current_scan_id) if current_scan_id else None
    
    if not current_scan:
        return {}
    
    asset_changes = detect_asset_changes(organization, previous_scan, current_scan)
    critical_vulns = detect_critical_vulnerability_changes(organization, current_scan)
    
    return {
        'asset_changes': asset_changes,
        'critical_vulnerabilities': critical_vulns,
        'scan_run_id': str(current_scan.id),
        'timestamp': current_scan.finished_at or current_scan.created_at
    }


def process_scan_snapshot(asset, scan_run, scan_data):
    """
    Process scan snapshot for an asset and detect changes.
    
    Args:
        asset: Asset instance
        scan_run: ScanRun instance
        scan_data: Dictionary containing scan data for the asset
    
    Returns:
        List of notifications/changes detected (empty list if none)
    """
    notifications = []
    
    try:
        # Update asset last_seen timestamp
        asset.last_seen = timezone.now()
        asset.save()
        
        # Check if this is a new asset (first time seen)
        if asset.first_seen == asset.last_seen:
            notifications.append({
                'type': 'new_asset',
                'asset_id': str(asset.id),
                'asset_name': asset.name,
                'asset_type': asset.asset_type
            })
            
            # Create asset change record
            AssetChange.objects.create(
                asset=asset,
                change_type='new',
                scan_run=scan_run,
                details=scan_data
            )
        
        # Check for status changes (if scan_data contains status info)
        if 'status' in scan_data and scan_data['status'] != asset.is_active:
            old_status = 'active' if asset.is_active else 'inactive'
            new_status = 'active' if scan_data['status'] else 'inactive'
            
            notifications.append({
                'type': 'status_change',
                'asset_id': str(asset.id),
                'asset_name': asset.name,
                'old_status': old_status,
                'new_status': new_status
            })
            
            asset.is_active = scan_data['status']
            asset.save()
            
            # Create asset change record
            AssetChange.objects.create(
                asset=asset,
                change_type='status_change',
                scan_run=scan_run,
                details=scan_data
            )
    
    except Exception as e:
        # Log error but don't fail the scan
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Error processing scan snapshot for {asset.name}: {str(e)}")
    
    return notifications
