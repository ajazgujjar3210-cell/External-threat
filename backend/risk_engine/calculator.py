"""
Risk calculation engine with explainable scoring.
"""
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta
from celery import shared_task
from vulnerabilities.models import Vulnerability
from assets.models import AssetMetadata
from .models import RiskScore


def calculate_risk_score(vulnerability):
    """
    Calculate risk score with explainable factors.
    
    Formula: Final Risk = CVSS × Exposure Factor × Asset Criticality × Age Factor
    
    Returns: (score, explanation_dict)
    """
    explanation = {
        'cvss_score': 0,
        'exposure_factor': 1.0,
        'asset_criticality': 1.0,
        'age_factor': 1.0,
        'calculation': '',
        'factors': {}
    }
    
    # Factor 1: CVSS Score (0-10, normalized to 0-1)
    cvss = float(vulnerability.cvss) if vulnerability.cvss else 5.0
    explanation['cvss_score'] = cvss
    cvss_normalized = cvss / 10.0
    
    # Factor 2: Exposure Factor
    # Based on asset type and status
    exposure_factor = 1.0
    if vulnerability.asset.asset_type == 'api':
        exposure_factor = 1.5  # APIs are more exposed
    elif vulnerability.asset.asset_type == 'domain':
        exposure_factor = 1.2  # Domains are public-facing
    elif vulnerability.asset.asset_type == 'subdomain':
        exposure_factor = 1.1
    
    if not vulnerability.asset.is_active:
        exposure_factor *= 0.5  # Inactive assets are less exposed
    
    explanation['exposure_factor'] = exposure_factor
    explanation['factors']['asset_type'] = vulnerability.asset.asset_type
    explanation['factors']['asset_active'] = vulnerability.asset.is_active
    
    # Factor 3: Asset Criticality
    criticality_factor = 1.0
    try:
        metadata = vulnerability.asset.metadata
        criticality_map = {
            'low': 0.5,
            'medium': 1.0,
            'high': 1.5,
            'critical': 2.0
        }
        criticality_factor = criticality_map.get(metadata.criticality, 1.0)
        explanation['asset_criticality'] = criticality_factor
        explanation['factors']['asset_criticality'] = metadata.criticality
    except AssetMetadata.DoesNotExist:
        explanation['factors']['asset_criticality'] = 'not_set'
    
    # Factor 4: Age Factor
    # Older vulnerabilities are more critical (longer exposure time)
    age_days = (timezone.now() - vulnerability.detected_at).days
    if age_days < 7:
        age_factor = 1.0
    elif age_days < 30:
        age_factor = 1.2
    elif age_days < 90:
        age_factor = 1.5
    else:
        age_factor = 2.0
    
    explanation['age_factor'] = age_factor
    explanation['factors']['age_days'] = age_days
    
    # Calculate final score (0-100)
    base_score = cvss_normalized * 10  # Convert to 0-10 scale
    final_score = base_score * exposure_factor * criticality_factor * age_factor
    
    # Cap at 100
    final_score = min(final_score, 100.0)
    
    # Build explanation
    explanation['calculation'] = (
        f"CVSS ({cvss}) × Exposure ({exposure_factor}) × "
        f"Criticality ({criticality_factor}) × Age ({age_factor}) = {final_score:.2f}"
    )
    
    return Decimal(str(final_score)).quantize(Decimal('0.01')), explanation


def calculate_and_save_risk_score(vulnerability):
    """
    Calculate risk score and save to database.
    """
    score, explanation = calculate_risk_score(vulnerability)
    
    risk_score, created = RiskScore.objects.update_or_create(
        vulnerability=vulnerability,
        defaults={
            'score': score,
            'explanation': explanation
        }
    )
    
    return risk_score


@shared_task
def recalculate_all_risks():
    """
    Recalculate risk scores for all vulnerabilities.
    """
    from risk_engine.calculator import calculate_and_save_risk_score
    
    vulnerabilities = Vulnerability.objects.filter(status__in=['open', 'in_progress'])
    count = 0
    
    for vuln in vulnerabilities:
        try:
            calculate_and_save_risk_score(vuln)
            count += 1
        except Exception as e:
            # Log error but continue
            print(f"Error calculating risk for {vuln.id}: {e}")
    
    return f"Recalculated {count} risk scores"

