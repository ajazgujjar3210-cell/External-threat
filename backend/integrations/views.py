"""
Integration views for external systems.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from accounts.permissions import IsViewerOrAbove
from accounts.models import Organization
from assets.models import Asset
from vulnerabilities.models import Vulnerability
from risk_engine.models import RiskScore
from django.utils import timezone
from datetime import timedelta


@api_view(['GET'])
@permission_classes([IsViewerOrAbove])
def api_documentation(request):
    """API documentation endpoint."""
    base_url = request.build_absolute_uri('/api/')
    
    docs = {
        'title': 'EASM Platform API Documentation',
        'version': '1.0',
        'base_url': base_url,
        'authentication': {
            'type': 'JWT Bearer Token',
            'header': 'Authorization: Bearer <token>',
            'endpoints': {
                'login': f'{base_url}auth/login/',
                'refresh': f'{base_url}auth/refresh/',
                'me': f'{base_url}auth/me/',
            }
        },
        'endpoints': {
            'assets': {
                'list': f'{base_url}assets/',
                'detail': f'{base_url}assets/<uuid>/',
                'discover': f'{base_url}assets/discover/',
                'unknown': f'{base_url}assets/unknown/',
                'changes': f'{base_url}assets/changes/',
                'categories': f'{base_url}assets/categories/',
            },
            'vulnerabilities': {
                'list': f'{base_url}vulnerabilities/',
                'detail': f'{base_url}vulnerabilities/<uuid>/',
                'update_status': f'{base_url}vulnerabilities/<uuid>/status/',
            },
            'risks': {
                'top': f'{base_url}risks/top/',
                'detail': f'{base_url}risks/<vulnerability_id>/',
            },
            'scans': {
                'list': f'{base_url}scans/',
                'detail': f'{base_url}scans/<uuid>/',
            },
            'reports': {
                'generate': f'{base_url}reports/generate/?type=<type>&format=<format>',
                'scheduled': f'{base_url}reports/scheduled/',
            },
            'audit': {
                'logs': f'{base_url}audit/logs/',
            },
        },
        'integration_examples': {
            'siem': {
                'description': 'Pull asset and vulnerability data for SIEM integration',
                'endpoints': [
                    f'{base_url}assets/?format=json',
                    f'{base_url}vulnerabilities/?format=json',
                ]
            },
            'soar': {
                'description': 'Trigger scans and retrieve results for SOAR automation',
                'endpoints': [
                    f'{base_url}assets/discover/',
                    f'{base_url}scans/',
                ]
            },
            'ticketing': {
                'description': 'Retrieve high-risk vulnerabilities for ticketing systems',
                'endpoints': [
                    f'{base_url}risks/top/?limit=50',
                ]
            }
        }
    }
    
    return Response(docs)


@api_view(['POST'])
@permission_classes([IsViewerOrAbove])
def import_assets(request):
    """Import assets from external sources."""
    user = request.user
    if user.role == 'super_admin':
        org_id = request.data.get('organization_id')
        if not org_id:
            return Response({'error': 'organization_id required'}, status=400)
        organization = Organization.objects.get(id=org_id)
    else:
        organization = user.organization
    
    assets_data = request.data.get('assets', [])
    imported = 0
    errors = []
    
    for asset_data in assets_data:
        try:
            asset, created = Asset.objects.get_or_create(
                organization=organization,
                name=asset_data['name'],
                asset_type=asset_data.get('asset_type', 'domain'),
                defaults={
                    'discovery_source': asset_data.get('source', 'import'),
                    'is_unknown': True,
                }
            )
            if created:
                imported += 1
        except Exception as e:
            errors.append(f"Error importing {asset_data.get('name', 'unknown')}: {str(e)}")
    
    return Response({
        'imported': imported,
        'errors': errors,
        'message': f'Successfully imported {imported} assets'
    })


@api_view(['GET'])
@permission_classes([IsViewerOrAbove])
def export_data(request):
    """Export data for external systems."""
    export_type = request.query_params.get('type', 'assets')
    format_type = request.query_params.get('format', 'json')
    
    user = request.user
    if user.role == 'super_admin':
        org_id = request.query_params.get('organization_id')
        if org_id:
            organization = Organization.objects.get(id=org_id)
        else:
            return Response({'error': 'organization_id required'}, status=400)
    else:
        organization = user.organization
    
    if export_type == 'assets':
        assets = Asset.objects.filter(organization=organization)
        data = [{
            'id': str(asset.id),
            'name': asset.name,
            'type': asset.asset_type,
            'status': 'active' if asset.is_active else 'inactive',
            'first_seen': asset.first_seen.isoformat(),
            'last_seen': asset.last_seen.isoformat(),
        } for asset in assets]
    elif export_type == 'vulnerabilities':
        vulnerabilities = Vulnerability.objects.filter(asset__organization=organization)
        data = [{
            'id': str(vuln.id),
            'asset': vuln.asset.name,
            'title': vuln.title,
            'severity': vuln.severity,
            'cvss': vuln.cvss,
            'status': vuln.status,
            'detected_at': vuln.detected_at.isoformat(),
        } for vuln in vulnerabilities]
    elif export_type == 'risks':
        risks = RiskScore.objects.filter(vulnerability__asset__organization=organization)
        data = [{
            'vulnerability_id': str(risk.vulnerability.id),
            'asset': risk.vulnerability.asset.name,
            'score': risk.score,
            'severity': risk.vulnerability.severity,
            'explanation': risk.explanation,
        } for risk in risks.order_by('-score')]
    else:
        return Response({'error': 'Invalid export type'}, status=400)
    
    return Response({
        'type': export_type,
        'format': format_type,
        'count': len(data),
        'data': data
    })

