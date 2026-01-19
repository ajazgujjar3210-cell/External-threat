"""
Background tasks for asset management.
"""
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from .models import Asset, AssetMetadata
from vulnerabilities.models import Vulnerability
from risk_engine.calculator import calculate_and_save_risk_score


@shared_task
def calculate_asset_aging():
    """
    Daily task to calculate and store asset aging.
    This runs as a background job to avoid calculating on-the-fly.
    """
    from assets.models import AssetMetadata
    
    assets = Asset.objects.filter(is_active=True)
    updated_count = 0
    
    for asset in assets:
        age_days = (timezone.now() - asset.first_seen).days
        
        # Get or create metadata
        metadata, created = AssetMetadata.objects.get_or_create(asset=asset)
        
        # Initialize metadata dict if needed
        if not metadata.metadata:
            metadata.metadata = {}
        if 'tags' not in metadata.metadata:
            metadata.metadata['tags'] = []
        
        # Update age tag
        age_tag = f"age_days:{age_days}"
        tags = metadata.metadata.get('tags', [])
        tags = [tag for tag in tags if not tag.startswith('age_days:')]
        tags.append(age_tag)
        metadata.metadata['tags'] = tags
        metadata.save()
        
        updated_count += 1
    
    return f"Updated aging for {updated_count} assets"


@shared_task
def calculate_vulnerability_aging():
    """
    Daily task to calculate and store vulnerability aging.
    """
    vulnerabilities = Vulnerability.objects.filter(status__in=['open', 'in_progress'])
    updated_count = 0
    
    for vuln in vulnerabilities:
        age_days = (timezone.now() - vuln.detected_at).days
        
        # Store age in evidence
        if not vuln.evidence:
            vuln.evidence = {}
        
        vuln.evidence['age_days'] = age_days
        vuln.evidence['age_updated'] = timezone.now().isoformat()
        vuln.save()
        
        # Recalculate risk score (age affects risk)
        try:
            calculate_and_save_risk_score(vuln)
        except Exception:
            pass
        
        updated_count += 1
    
    return f"Updated aging for {updated_count} vulnerabilities"

