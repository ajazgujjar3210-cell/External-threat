"""
Compliance report generation for ISO 27001, PCI DSS, and SBP.
"""
import csv
import io
from datetime import datetime
from django.http import HttpResponse
from assets.models import Asset
from vulnerabilities.models import Vulnerability
from risk_engine.models import RiskScore
from accounts.models import Organization


def generate_iso27001_report(organization, format_type='csv'):
    """
    Generate ISO 27001 compliance report.
    Focus on external exposure requirements.
    """
    assets = Asset.objects.filter(organization=organization)
    vulnerabilities = Vulnerability.objects.filter(asset__organization=organization)
    
    if format_type == 'csv':
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="ISO27001_External_Exposure_{datetime.now().strftime("%Y%m%d")}.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['ISO 27001 External Exposure Report'])
        writer.writerow(['Generated:', datetime.now().strftime('%Y-%m-%d %H:%M:%S')])
        writer.writerow(['Organization:', organization.name])
        writer.writerow([])
        
        writer.writerow(['Asset Inventory'])
        writer.writerow(['Name', 'Type', 'Status', 'Criticality', 'Sensitivity', 'First Seen', 'Last Seen'])
        for asset in assets:
            try:
                metadata = asset.metadata
                criticality = metadata.criticality
            except:
                criticality = 'Not Set'
            writer.writerow([
                asset.name,
                asset.asset_type,
                'Active' if asset.is_active else 'Inactive',
                criticality,
                asset.sensitivity,
                asset.first_seen.strftime('%Y-%m-%d'),
                asset.last_seen.strftime('%Y-%m-%d')
            ])
        
        writer.writerow([])
        writer.writerow(['Vulnerability Summary'])
        writer.writerow(['Severity', 'Count'])
        for severity in ['critical', 'high', 'medium', 'low', 'info']:
            count = vulnerabilities.filter(severity=severity).count()
            writer.writerow([severity.capitalize(), count])
        
        return response
    
    return generate_iso27001_report(organization, 'csv')


def generate_pci_dss_report(organization, format_type='csv'):
    """
    Generate PCI DSS compliance report.
    Focus on external exposure requirements.
    """
    assets = Asset.objects.filter(organization=organization)
    vulnerabilities = Vulnerability.objects.filter(
        asset__organization=organization,
        severity__in=['critical', 'high']
    )
    
    if format_type == 'csv':
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="PCI_DSS_External_Exposure_{datetime.now().strftime("%Y%m%d")}.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['PCI DSS External Exposure Report'])
        writer.writerow(['Generated:', datetime.now().strftime('%Y-%m-%d %H:%M:%S')])
        writer.writerow(['Organization:', organization.name])
        writer.writerow([])
        
        writer.writerow(['Critical and High Severity Vulnerabilities'])
        writer.writerow(['Asset', 'Vulnerability', 'Severity', 'CVSS', 'Status', 'Detected'])
        for vuln in vulnerabilities:
            writer.writerow([
                vuln.asset.name,
                vuln.title,
                vuln.severity,
                vuln.cvss or 'N/A',
                vuln.status,
                vuln.detected_at.strftime('%Y-%m-%d')
            ])
        
        writer.writerow([])
        writer.writerow(['External Assets Summary'])
        writer.writerow(['Total Assets', assets.count()])
        writer.writerow(['Active Assets', assets.filter(is_active=True).count()])
        writer.writerow(['Unknown Assets', assets.filter(is_unknown=True).count()])
        
        return response
    
    return generate_pci_dss_report(organization, 'csv')


def generate_sbp_report(organization, format_type='csv'):
    """
    Generate State Bank of Pakistan (SBP) compliance report.
    """
    assets = Asset.objects.filter(organization=organization)
    vulnerabilities = Vulnerability.objects.filter(asset__organization=organization)
    risks = RiskScore.objects.filter(vulnerability__asset__organization=organization)
    
    if format_type == 'csv':
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="SBP_Compliance_{datetime.now().strftime("%Y%m%d")}.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['State Bank of Pakistan - External Threat Surface Report'])
        writer.writerow(['Generated:', datetime.now().strftime('%Y-%m-%d %H:%M:%S')])
        writer.writerow(['Organization:', organization.name])
        writer.writerow([])
        
        writer.writerow(['Executive Summary'])
        writer.writerow(['Metric', 'Value'])
        writer.writerow(['Total External Assets', assets.count()])
        writer.writerow(['Active Assets', assets.filter(is_active=True).count()])
        writer.writerow(['Unknown/Unmanaged Assets', assets.filter(is_unknown=True).count()])
        writer.writerow(['Total Vulnerabilities', vulnerabilities.count()])
        writer.writerow(['Critical Vulnerabilities', vulnerabilities.filter(severity='critical').count()])
        writer.writerow(['High Risk Assets', risks.filter(score__gte=80).count()])
        
        writer.writerow([])
        writer.writerow(['High Priority Risks'])
        writer.writerow(['Risk Score', 'Asset', 'Vulnerability', 'Severity', 'Status'])
        for risk in risks.order_by('-score')[:20]:
            writer.writerow([
                risk.score,
                risk.vulnerability.asset.name,
                risk.vulnerability.title,
                risk.vulnerability.severity,
                risk.vulnerability.status
            ])
        
        return response
    
    return generate_sbp_report(organization, 'csv')

