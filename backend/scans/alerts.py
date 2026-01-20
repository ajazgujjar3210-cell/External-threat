"""
Alerting system for EASM Platform.
"""
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from accounts.models import User, Organization
from vulnerabilities.models import Vulnerability
from assets.models import AssetChange, AlertConfiguration


def get_alert_config(organization):
    """
    Get or create alert configuration for organization.
    """
    try:
        return AlertConfiguration.objects.get(organization=organization)
    except AlertConfiguration.DoesNotExist:
        # Create default configuration
        return AlertConfiguration.objects.create(
            organization=organization,
            enabled=True,
            email_enabled=True,
            notify_on_low=False,
            notify_on_medium=True,
            notify_on_high=True,
            notify_on_critical=True
        )


def should_send_notification(organization, severity):
    """
    Check if notification should be sent based on alert configuration and severity.
    """
    try:
        config = get_alert_config(organization)
        
        # Check if alerts are enabled
        if not config.enabled or not config.email_enabled:
            return False
        
        # Check severity-based settings
        if severity == 'low' and not config.notify_on_low:
            return False
        elif severity == 'medium' and not config.notify_on_medium:
            return False
        elif severity == 'high' and not config.notify_on_high:
            return False
        elif severity == 'critical' and not config.notify_on_critical:
            return False
        
        return True
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error checking alert configuration: {str(e)}")
        # Default to True if there's an error (fail open)
        return True


def send_alert_email(user, subject, message, html_message=None, severity='medium'):
    """
    Send alert email to user, checking alert configuration.
    """
    # Check if email is configured
    if not settings.EMAIL_HOST_USER or not settings.EMAIL_HOST_PASSWORD:
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Email not configured. Alert email not sent to {user.email}")
        return False
    
    # Check organization alert configuration
    if user.organization:
        if not should_send_notification(user.organization, severity):
            import logging
            logger = logging.getLogger(__name__)
            logger.info(f"Notification skipped for {user.email} - severity {severity} not enabled in alert config")
            return False
    
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL or settings.EMAIL_HOST_USER,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False  # Changed to False to see errors
        )
        return True
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to send alert email to {user.email}: {str(e)}")
        return False


def alert_new_critical_vulnerability(vulnerability):
    """
    Alert organization admins about new critical vulnerability.
    Uses configurable severity-based notification settings.
    """
    if vulnerability.severity not in ['critical', 'high']:
        return
    
    organization = vulnerability.asset.organization
    admins = User.objects.filter(
        organization=organization,
        role__in=['org_admin', 'super_admin'],
        is_active=True
    )
    
    # Determine severity for notification check
    severity = vulnerability.severity
    
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
        send_alert_email(admin, subject, message, html_message, severity=severity)


def alert_new_asset(asset_change):
    """
    Alert about new asset discovery.
    Uses configurable severity-based notification settings.
    """
    if asset_change.change_type != 'new':
        return
    
    organization = asset_change.asset.organization
    
    # Determine severity based on asset characteristics
    # Unknown assets are higher severity
    severity = 'high' if asset_change.asset.is_unknown else 'medium'
    
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
Unknown Asset: {'Yes' if asset_change.asset.is_unknown else 'No'}

EASM Platform
"""
    
    for admin in admins:
        send_alert_email(admin, subject, message, severity=severity)


def alert_asset_removed(asset_change):
    """
    Alert about asset removal.
    Uses configurable severity-based notification settings.
    """
    if asset_change.change_type != 'removed':
        return
    
    organization = asset_change.asset.organization
    # Asset removal is typically medium severity
    severity = 'medium'
    
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
        send_alert_email(admin, subject, message, severity=severity)


def alert_discovery_completion(scan_run):
    """
    Send comprehensive email notification when discovery scan is completed with all discovered assets.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"alert_discovery_completion called for scan {scan_run.id}, type={scan_run.scan_type}, status={scan_run.status}")
    
    if scan_run.scan_type != 'discovery' or scan_run.status != 'completed':
        logger.info(f"Skipping email: scan_type={scan_run.scan_type}, status={scan_run.status}")
        return
    
    organization = scan_run.organization
    logger.info(f"Organization: {organization.name} (ID: {organization.id})")
    
    # Send to organization admins (and super_admin as fallback)
    admins = User.objects.filter(
        organization=organization,
        role__in=['org_admin'],
        is_active=True
    )
    
    # If no org_admin found, also include super_admin
    if not admins.exists():
        admins = User.objects.filter(
            role='super_admin',
            is_active=True
        )
        logger.info(f"No org_admin found for organization {organization.name}, sending to super_admin instead")
    
    if not admins.exists():
        logger.warning(f"No active admins found to send discovery completion email for organization {organization.name}")
        return
    
    logger.info(f"Sending discovery completion email to {admins.count()} admin(s) for organization {organization.name}")
    
    results = scan_run.results or {}
    assets_discovered = results.get('assets_discovered', 0)
    assets_saved = results.get('assets_saved', 0)
    assets_list = results.get('assets', [])
    source_breakdown = results.get('source_breakdown', {})
    
    # Get domain and scan configuration from config
    domain = scan_run.config.get('domain', 'N/A')
    enable_port_scan = scan_run.config.get('enable_port_scan', False)
    enable_service_detection = scan_run.config.get('enable_service_detection', False)
    
    # Determine discovery type
    discovery_type_parts = ["Asset Discovery"]
    if enable_port_scan:
        discovery_type_parts.append("Port Scanning")
    if enable_service_detection:
        discovery_type_parts.append("Service Detection")
    discovery_type = " + ".join(discovery_type_parts)
    
    # Group assets by type
    assets_by_type = {}
    for asset in assets_list:
        asset_type = asset.get('type', 'unknown')
        if asset_type not in assets_by_type:
            assets_by_type[asset_type] = []
        assets_by_type[asset_type].append(asset)
    
    # Calculate scan duration
    duration = None
    if scan_run.started_at and scan_run.finished_at:
        delta = scan_run.finished_at - scan_run.started_at
        total_seconds = int(delta.total_seconds())
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        seconds = total_seconds % 60
        if hours > 0:
            duration = f"{hours}h {minutes}m {seconds}s"
        elif minutes > 0:
            duration = f"{minutes}m {seconds}s"
        else:
            duration = f"{seconds}s"
    
    subject = f"🔍 Asset Discovery Completed: {assets_discovered} Assets Found for {domain}"
    
    # Build assets list text grouped by type
    assets_text = ""
    if assets_list:
        assets_text = "\n\n" + "=" * 70 + "\n"
        assets_text += "DISCOVERED ASSETS DETAILS\n"
        assets_text += "=" * 70 + "\n\n"
        
        # Show assets grouped by type
        for asset_type, type_assets in sorted(assets_by_type.items()):
            type_display = asset_type.replace('_', ' ').title()
            assets_text += f"\n{type_display} ({len(type_assets)} found):\n"
            assets_text += "-" * 70 + "\n"
            
            for idx, asset in enumerate(type_assets[:20], 1):  # Show up to 20 per type
                asset_name = asset.get('name', 'Unknown')
                asset_source = asset.get('source', 'unknown')
                metadata = asset.get('metadata', {})
                
                assets_text += f"  {idx}. {asset_name}\n"
                assets_text += f"     Source: {asset_source}\n"
                
                # Add metadata if available
                if metadata:
                    if 'ip_addresses' in metadata and metadata['ip_addresses']:
                        ips = ', '.join(metadata['ip_addresses'][:3])
                        if len(metadata['ip_addresses']) > 3:
                            ips += f" (+{len(metadata['ip_addresses']) - 3} more)"
                        assets_text += f"     IP Addresses: {ips}\n"
                    if 'open_ports' in metadata and metadata['open_ports']:
                        ports = ', '.join(map(str, metadata['open_ports'][:5]))
                        if len(metadata['open_ports']) > 5:
                            ports += f" (+{len(metadata['open_ports']) - 5} more)"
                        assets_text += f"     Open Ports: {ports}\n"
                    if 'services' in metadata and metadata['services']:
                        services = ', '.join(list(metadata['services'].keys())[:3])
                        assets_text += f"     Services: {services}\n"
                
                assets_text += "\n"
            
            if len(type_assets) > 20:
                assets_text += f"  ... and {len(type_assets) - 20} more {asset_type} assets.\n\n"
        
        if len(assets_list) > 100:
            assets_text += f"\nNote: Showing first 100 assets. Total discovered: {len(assets_list)}\n"
    else:
        assets_text = "\n\nNo new assets were discovered in this scan.\n"
    
    # Build source breakdown text
    source_text = ""
    if source_breakdown:
        source_text = "\n\nDiscovery Source Breakdown:\n"
        source_text += "-" * 70 + "\n"
        for source, count in sorted(source_breakdown.items(), key=lambda x: x[1], reverse=True):
            source_text += f"  • {source}: {count} assets\n"
    
    # Build asset type breakdown
    type_breakdown_text = ""
    if assets_by_type:
        type_breakdown_text = "\n\nAssets by Type:\n"
        type_breakdown_text += "-" * 70 + "\n"
        for asset_type, type_assets in sorted(assets_by_type.items(), key=lambda x: len(x[1]), reverse=True):
            type_display = asset_type.replace('_', ' ').title()
            type_breakdown_text += f"  • {type_display}: {len(type_assets)} assets\n"
    
    message = f"""
═══════════════════════════════════════════════════════════════════
    ASSET DISCOVERY SCAN COMPLETED - DETAILED REPORT
═══════════════════════════════════════════════════════════════════

ORGANIZATION: {organization.name}
DISCOVERY TYPE: {discovery_type}
TARGET DOMAIN: {domain}

═══════════════════════════════════════════════════════════════════
SCAN SUMMARY
═══════════════════════════════════════════════════════════════════

Status: ✅ Completed Successfully
Assets Discovered: {assets_discovered}
Assets Saved to Database: {assets_saved}
Scan Started: {scan_run.started_at.strftime('%Y-%m-%d %H:%M:%S UTC') if scan_run.started_at else 'N/A'}
Scan Completed: {scan_run.finished_at.strftime('%Y-%m-%d %H:%M:%S UTC') if scan_run.finished_at else 'N/A'}
Scan Duration: {duration or 'N/A'}

Scan Configuration:
  • Port Scanning: {'Enabled' if enable_port_scan else 'Disabled'}
  • Service Detection: {'Enabled' if enable_service_detection else 'Disabled'}

{type_breakdown_text}{source_text}{assets_text}

═══════════════════════════════════════════════════════════════════
NEXT STEPS
═══════════════════════════════════════════════════════════════════

1. Review all discovered assets in the EASM Platform dashboard
2. Classify and assign ownership to newly discovered assets
3. Mark known assets to reduce false positives
4. Set up scheduled discovery scans for continuous monitoring

═══════════════════════════════════════════════════════════════════

Best regards,
EASM Platform Team

This is an automated notification. Please do not reply to this email.
"""
    
    # Build HTML message with detailed asset information
    assets_html = ""
    if assets_list:
        assets_html = "<div style='padding: 30px; background: #f9fafb; border-top: 1px solid #e5e7eb;'>"
        assets_html += "<h3 style='margin: 0 0 25px 0; font-size: 18px; font-weight: 600; color: #1f2937; display: flex; align-items: center; gap: 10px;'>"
        assets_html += "<span style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;'>📋</span>"
        assets_html += "Discovered Assets by Type</h3>"
        
        # Group assets by type in HTML
        for asset_type, type_assets in sorted(assets_by_type.items()):
            type_display = asset_type.replace('_', ' ').title()
            assets_html += f"<div style='margin-bottom: 30px;'>"
            assets_html += f"<div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 20px; border-radius: 10px 10px 0 0; margin-bottom: 0;'>"
            assets_html += f"<h4 style='margin: 0; font-size: 16px; font-weight: 600;'>{type_display} <span style='opacity: 0.9;'>({len(type_assets)} found)</span></h4>"
            assets_html += "</div>"
            assets_html += "<div style='background: white; border: 2px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; overflow: hidden;'>"
            assets_html += "<div style='max-height: 400px; overflow-y: auto;'>"
            
            for idx, asset in enumerate(type_assets[:20], 1):  # Show up to 20 per type
                asset_name = asset.get('name', 'Unknown')
                asset_source = asset.get('source', 'unknown')
                metadata = asset.get('metadata', {})
                
                # Build details column
                details = []
                if 'ip_addresses' in metadata and metadata['ip_addresses']:
                    ips = ', '.join(metadata['ip_addresses'][:2])
                    if len(metadata['ip_addresses']) > 2:
                        ips += f" (+{len(metadata['ip_addresses']) - 2})"
                    details.append(f"<span style='background: #e0e7ff; color: #3730a3; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600;'>IPs: {ips}</span>")
                if 'open_ports' in metadata and metadata['open_ports']:
                    ports = ', '.join(map(str, metadata['open_ports'][:3]))
                    if len(metadata['open_ports']) > 3:
                        ports += f" (+{len(metadata['open_ports']) - 3})"
                    details.append(f"<span style='background: #dbeafe; color: #1e40af; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600;'>Ports: {ports}</span>")
                if 'services' in metadata and metadata['services']:
                    services = ', '.join(list(metadata['services'].keys())[:2])
                    details.append(f"<span style='background: #dcfce7; color: #166534; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600;'>Services: {services}</span>")
                
                details_text = ' '.join(details) if details else '<span style="color: #9ca3af;">-</span>'
                
                row_bg = '#ffffff' if idx % 2 == 0 else '#f9fafb'
                assets_html += f"<div style='background: {row_bg}; padding: 15px 20px; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 15px;'>"
                assets_html += f"<div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; flex-shrink: 0;'>{idx}</div>"
                assets_html += f"<div style='flex: 1; min-width: 0;'><div style='color: #1f2937; font-weight: 600; font-size: 14px; margin-bottom: 5px; word-break: break-word;'>{asset_name}</div>"
                assets_html += f"<div style='color: #6b7280; font-size: 12px; margin-bottom: 8px;'>Source: <span style='color: #1f2937; font-weight: 600;'>{asset_source}</span></div>"
                assets_html += f"<div style='display: flex; gap: 8px; flex-wrap: wrap;'>{details_text}</div></div>"
                assets_html += "</div>"
            
            assets_html += "</div></div>"
            
            if len(type_assets) > 20:
                assets_html += f"<div style='background: #fef3c7; padding: 12px 20px; border-radius: 0 0 10px 10px; border: 2px solid #e5e7eb; border-top: none;'><p style='margin: 0; color: #78350f; font-size: 13px; font-weight: 600;'>... and {len(type_assets) - 20} more {asset_type} assets.</p></div>"
            
            assets_html += "</div>"
        
        if len(assets_list) > 100:
            assets_html += f"<div style='background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 15px 20px; border-radius: 10px; margin-top: 20px; border: 2px solid #f59e0b;'><p style='margin: 0; color: #78350f; font-size: 13px; font-weight: 600;'><strong>Note:</strong> Showing first 100 assets. Total discovered: {len(assets_list)}</p></div>"
        assets_html += "</div>"
    else:
        assets_html = "<div style='padding: 30px; background: #f9fafb; border-top: 1px solid #e5e7eb;'><div style='background: white; padding: 40px; border-radius: 12px; border: 2px solid #e5e7eb; text-align: center;'><p style='margin: 0; color: #6b7280; font-size: 15px;'>No new assets were discovered in this scan.</p></div></div>"
    
    # Build source breakdown HTML
    source_html = ""
    if source_breakdown:
        source_html = "<div style='padding: 30px; background: white; border-top: 1px solid #e5e7eb;'>"
        source_html += "<h3 style='margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #1f2937; display: flex; align-items: center; gap: 10px;'>"
        source_html += "<span style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;'>🔍</span>"
        source_html += "Discovery Source Breakdown</h3>"
        source_html += "<div style='display: grid; gap: 12px;'>"
        for source, count in sorted(source_breakdown.items(), key=lambda x: x[1], reverse=True):
            source_html += f"<div style='background: linear-gradient(135deg, #f6f8fb 0%, #e9ecef 100%); padding: 15px 20px; border-radius: 10px; border: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;'>"
            source_html += f"<span style='color: #1f2937; font-weight: 600; font-size: 14px;'>{source}</span>"
            source_html += f"<span style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 6px 16px; border-radius: 20px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 10px rgba(102, 126, 234, 0.3);'>{count}</span>"
            source_html += "</div>"
        source_html += "</div></div>"
    
    # Build asset type breakdown HTML
    type_breakdown_html = ""
    if assets_by_type:
        type_breakdown_html = "<div style='padding: 30px; background: #f9fafb; border-top: 1px solid #e5e7eb;'>"
        type_breakdown_html += "<h3 style='margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #1f2937; display: flex; align-items: center; gap: 10px;'>"
        type_breakdown_html += "<span style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;'>📊</span>"
        type_breakdown_html += "Assets by Type</h3>"
        type_breakdown_html += "<div style='display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px;'>"
        for asset_type, type_assets in sorted(assets_by_type.items(), key=lambda x: len(x[1]), reverse=True):
            type_display = asset_type.replace('_', ' ').title()
            type_breakdown_html += f"<div style='background: white; padding: 20px; border-radius: 12px; border: 2px solid #e5e7eb; box-shadow: 0 4px 6px rgba(0,0,0,0.05); text-align: center; transition: transform 0.2s;'>"
            type_breakdown_html += f"<div style='color: #6b7280; font-size: 12px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;'>{type_display}</div>"
            type_breakdown_html += f"<div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: 36px; font-weight: 700;'>{len(type_assets)}</div>"
            type_breakdown_html += "</div>"
        type_breakdown_html += "</div></div>"
    
    html_message = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Asset Discovery Scan Completed</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; padding: 20px;">
    <div style="max-width: 900px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden;">
        <!-- Header with Gradient -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; color: white;">
            <div style="background: rgba(255,255,255,0.2); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 40px; backdrop-filter: blur(10px);">
                🔍
            </div>
            <h1 style="margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">Asset Discovery Completed</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">Comprehensive Discovery Report</p>
        </div>
        
        <!-- Organization Info Card -->
        <div style="background: linear-gradient(135deg, #f6f8fb 0%, #e9ecef 100%); padding: 25px 30px; border-bottom: 1px solid #e5e7eb;">
            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold; flex-shrink: 0;">
                    {organization.name[0].upper()}
                </div>
                <div>
                    <h2 style="margin: 0; font-size: 22px; font-weight: 600; color: #1f2937;">{organization.name}</h2>
                    <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Discovery Scan Summary</p>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 20px;">
                <div style="background: white; padding: 15px; border-radius: 10px; border: 1px solid #e5e7eb;">
                    <div style="color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; font-weight: 600;">Target Domain</div>
                    <div style="color: #1f2937; font-size: 16px; font-weight: 600;">{domain}</div>
                </div>
                <div style="background: white; padding: 15px; border-radius: 10px; border: 1px solid #e5e7eb;">
                    <div style="color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; font-weight: 600;">Discovery Type</div>
                    <div style="color: #1f2937; font-size: 16px; font-weight: 600;">{discovery_type}</div>
                </div>
            </div>
        </div>
        
        <!-- Stats Cards -->
        <div style="padding: 30px; background: #f9fafb;">
            <h3 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #1f2937; display: flex; align-items: center; gap: 10px;">
                <span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">📊</span>
                Scan Summary
            </h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 12px; color: white; box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);">
                    <div style="font-size: 12px; opacity: 0.9; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Assets Discovered</div>
                    <div style="font-size: 42px; font-weight: 700; line-height: 1;">{assets_discovered}</div>
                </div>
                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 25px; border-radius: 12px; color: white; box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);">
                    <div style="font-size: 12px; opacity: 0.9; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Assets Saved</div>
                    <div style="font-size: 42px; font-weight: 700; line-height: 1;">{assets_saved}</div>
                </div>
                <div style="background: white; padding: 25px; border-radius: 12px; border: 2px solid #e5e7eb; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                    <div style="color: #6b7280; font-size: 12px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Scan Duration</div>
                    <div style="color: #1f2937; font-size: 28px; font-weight: 700;">{duration or 'N/A'}</div>
                </div>
                <div style="background: white; padding: 25px; border-radius: 12px; border: 2px solid #e5e7eb; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                    <div style="color: #6b7280; font-size: 12px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Completed At</div>
                    <div style="color: #1f2937; font-size: 14px; font-weight: 600;">{scan_run.finished_at.strftime('%Y-%m-%d %H:%M:%S UTC') if scan_run.finished_at else 'N/A'}</div>
                </div>
            </div>
            
            <!-- Configuration Badges -->
            <div style="margin-top: 25px; padding: 20px; background: white; border-radius: 12px; border: 2px solid #e5e7eb;">
                <div style="color: #1f2937; font-size: 14px; font-weight: 600; margin-bottom: 15px;">Scan Configuration</div>
                <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                    <div style="background: {'linear-gradient(135deg, #10b981 0%, #059669 100%)' if enable_port_scan else 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'}; color: white; padding: 10px 20px; border-radius: 20px; font-size: 13px; font-weight: 600; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                        {'✓' if enable_port_scan else '✗'} Port Scanning
                    </div>
                    <div style="background: {'linear-gradient(135deg, #10b981 0%, #059669 100%)' if enable_service_detection else 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'}; color: white; padding: 10px 20px; border-radius: 20px; font-size: 13px; font-weight: 600; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                        {'✓' if enable_service_detection else '✗'} Service Detection
                    </div>
                </div>
            </div>
        </div>
        
        {type_breakdown_html}
        
        {source_html}
        
        {assets_html}
        
        <!-- Next Steps -->
        <div style="padding: 30px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-top: 1px solid #e5e7eb;">
            <h3 style="margin: 0 0 15px 0; font-size: 18px; font-weight: 600; color: #92400e; display: flex; align-items: center; gap: 10px;">
                📋 Next Steps
            </h3>
            <ol style="margin: 0; padding-left: 20px; color: #78350f;">
                <li style="margin: 10px 0;">Review all discovered assets in the EASM Platform dashboard</li>
                <li style="margin: 10px 0;">Classify and assign ownership to newly discovered assets</li>
                <li style="margin: 10px 0;">Mark known assets to reduce false positives</li>
                <li style="margin: 10px 0;">Set up scheduled discovery scans for continuous monitoring</li>
            </ol>
        </div>
        
        <!-- Footer -->
        <div style="background: #1f2937; padding: 25px 30px; text-align: center; color: #9ca3af;">
            <p style="margin: 0 0 10px 0; font-size: 13px;">
                This is an automated notification from the <strong style="color: #ffffff;">EASM Platform</strong>
            </p>
            <p style="margin: 0; font-size: 12px; opacity: 0.8;">
                Please do not reply to this email
            </p>
        </div>
    </div>
</body>
</html>
"""
    
    # Send email to all admins and log results
    import logging
    logger = logging.getLogger(__name__)
    
    email_sent_count = 0
    email_failed_count = 0
    
    for admin in admins:
        try:
            result = send_alert_email(admin, subject, message, html_message)
            if result:
                email_sent_count += 1
                logger.info(f"Discovery completion email sent successfully to {admin.email} for scan {scan_run.id}")
            else:
                email_failed_count += 1
                logger.error(f"Failed to send discovery completion email to {admin.email} for scan {scan_run.id}")
        except Exception as e:
            email_failed_count += 1
            logger.error(f"Exception sending discovery completion email to {admin.email}: {str(e)}")
    
    logger.info(f"Discovery completion email summary: {email_sent_count} sent, {email_failed_count} failed for scan {scan_run.id}")
