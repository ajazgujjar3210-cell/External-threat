"""
Alerting system for EASM Platform.
"""
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from accounts.models import User, Organization
from vulnerabilities.models import Vulnerability
from assets.models import AssetChange


def send_alert_email(user, subject, message, html_message=None):
    """
    Send alert email to user.
    """
    if not settings.EMAIL_HOST_USER:
        # Email not configured, skip
        return False
    
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL or settings.EMAIL_HOST_USER,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=True
        )
        return True
    except Exception:
        return False


def alert_new_critical_vulnerability(vulnerability):
    """
    Alert organization admins about new critical vulnerability.
    """
    if vulnerability.severity not in ['critical', 'high']:
        return
    
    organization = vulnerability.asset.organization
    admins = User.objects.filter(
        organization=organization,
        role__in=['org_admin', 'super_admin'],
        is_active=True
    )
    
    subject = f"🚨 Critical Vulnerability Detected: {vulnerability.title}"
    message = f"""
A new {vulnerability.severity} severity vulnerability has been detected:

Title: {vulnerability.title}
Asset: {vulnerability.asset.name} ({vulnerability.asset.asset_type})
Severity: {vulnerability.severity}
CVSS: {vulnerability.cvss or 'N/A'}
Detected: {vulnerability.detected_at}

Please review and take appropriate action.

EASM Platform
"""
    
    html_message = f"""
    <html>
    <body>
        <h2>Critical Vulnerability Detected</h2>
        <p>A new <strong>{vulnerability.severity}</strong> severity vulnerability has been detected:</p>
        <ul>
            <li><strong>Title:</strong> {vulnerability.title}</li>
            <li><strong>Asset:</strong> {vulnerability.asset.name} ({vulnerability.asset.asset_type})</li>
            <li><strong>Severity:</strong> {vulnerability.severity}</li>
            <li><strong>CVSS:</strong> {vulnerability.cvss or 'N/A'}</li>
            <li><strong>Detected:</strong> {vulnerability.detected_at}</li>
        </ul>
        <p>Please review and take appropriate action.</p>
        <p>EASM Platform</p>
    </body>
    </html>
    """
    
    for admin in admins:
        send_alert_email(admin, subject, message, html_message)


def alert_new_asset(asset_change):
    """
    Alert about new asset discovery.
    """
    if asset_change.change_type != 'new':
        return
    
    organization = asset_change.asset.organization
    admins = User.objects.filter(
        organization=organization,
        role__in=['org_admin'],
        is_active=True
    )
    
    subject = f"New Asset Discovered: {asset_change.asset.name}"
    message = f"""
A new asset has been discovered:

Name: {asset_change.asset.name}
Type: {asset_change.asset.asset_type}
Source: {asset_change.asset.discovery_source}
Discovered: {asset_change.timestamp}

EASM Platform
"""
    
    for admin in admins:
        send_alert_email(admin, subject, message)


def alert_asset_removed(asset_change):
    """
    Alert about asset removal.
    """
    if asset_change.change_type != 'removed':
        return
    
    organization = asset_change.asset.organization
    admins = User.objects.filter(
        organization=organization,
        role__in=['org_admin'],
        is_active=True
    )
    
    subject = f"Asset Removed: {asset_change.asset.name}"
    message = f"""
An asset has been removed (no longer detected):

Name: {asset_change.asset.name}
Type: {asset_change.asset.asset_type}
Removed: {asset_change.timestamp}

EASM Platform
"""
    
    for admin in admins:
        send_alert_email(admin, subject, message)

