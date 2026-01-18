"""
Report generation engine.
"""
import csv
import io
from datetime import datetime
from django.http import HttpResponse
from django.utils import timezone
from assets.models import Asset
from vulnerabilities.models import Vulnerability
from risk_engine.models import RiskScore
from accounts.models import Organization


def generate_asset_inventory_report(organization, format_type='csv'):
    """
    Generate asset inventory report.
    """
    assets = Asset.objects.filter(organization=organization).order_by('-last_seen')
    
    if format_type == 'csv':
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="asset_inventory_{datetime.now().strftime("%Y%m%d")}.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['Name', 'Type', 'Status', 'First Seen', 'Last Seen', 'Discovery Source'])
        
        for asset in assets:
            writer.writerow([
                asset.name,
                asset.asset_type,
                'Active' if asset.is_active else 'Inactive',
                asset.first_seen.strftime('%Y-%m-%d %H:%M:%S'),
                asset.last_seen.strftime('%Y-%m-%d %H:%M:%S'),
                asset.discovery_source
            ])
        
        return response
    
    elif format_type == 'excel':
        # For Excel, we'd use openpyxl or xlsxwriter
        # For now, return CSV with .xlsx extension
        response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = f'attachment; filename="asset_inventory_{datetime.now().strftime("%Y%m%d")}.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['Name', 'Type', 'Status', 'First Seen', 'Last Seen', 'Discovery Source'])
        
        for asset in assets:
            writer.writerow([
                asset.name,
                asset.asset_type,
                'Active' if asset.is_active else 'Inactive',
                asset.first_seen.strftime('%Y-%m-%d %H:%M:%S'),
                asset.last_seen.strftime('%Y-%m-%d %H:%M:%S'),
                asset.discovery_source
            ])
        
        return response
    
    else:  # PDF - would need reportlab
        # For now, return CSV
        return generate_asset_inventory_report(organization, 'csv')


def generate_risk_summary_report(organization, format_type='csv'):
    """
    Generate risk summary report.
    """
    risks = RiskScore.objects.filter(
        vulnerability__asset__organization=organization
    ).order_by('-score')[:100]
    
    if format_type == 'csv':
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="risk_summary_{datetime.now().strftime("%Y%m%d")}.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['Risk Score', 'Vulnerability', 'Asset', 'Severity', 'CVSS', 'Status', 'Calculated At'])
        
        for risk in risks:
            writer.writerow([
                risk.score,
                risk.vulnerability.title,
                risk.vulnerability.asset.name,
                risk.vulnerability.severity,
                risk.vulnerability.cvss or 'N/A',
                risk.vulnerability.status,
                risk.calculated_at.strftime('%Y-%m-%d %H:%M:%S')
            ])
        
        return response
    
    else:
        return generate_risk_summary_report(organization, 'csv')


def generate_vulnerability_report(organization, format_type='csv'):
    """
    Generate vulnerability report.
    """
    vulnerabilities = Vulnerability.objects.filter(
        asset__organization=organization
    ).order_by('-detected_at')
    
    if format_type == 'csv':
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="vulnerabilities_{datetime.now().strftime("%Y%m%d")}.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['Title', 'Asset', 'Severity', 'CVSS', 'Status', 'Category', 'Detected At'])
        
        for vuln in vulnerabilities:
            writer.writerow([
                vuln.title,
                vuln.asset.name,
                vuln.severity,
                vuln.cvss or 'N/A',
                vuln.status,
                vuln.category,
                vuln.detected_at.strftime('%Y-%m-%d %H:%M:%S')
            ])
        
        return response
    
    else:
        return generate_vulnerability_report(organization, 'csv')

