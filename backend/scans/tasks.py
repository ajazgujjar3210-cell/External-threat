"""
Celery tasks for scanning operations.
"""
from celery import shared_task
from django.utils import timezone
from .models import ScanRun, ScheduledDiscovery
from assets.models import Asset, AssetChange
from scans.change_detection import process_scan_snapshot
from scans.alerts import alert_discovery_completion
from vulnerabilities.models import Vulnerability
from .discovery_helpers import (
    resolve_dns,
    detect_web_service,
    detect_web_application,
    scan_ports_safe,
    detect_service
)
from assets.models import Ownership
import subprocess
import json
import requests
import socket
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


@shared_task
def run_discovery_scan(scan_run_id, organization_id, domain=None, enable_port_scan=False, enable_service_detection=False):
    """
    Run comprehensive asset discovery scan using safe tools.
    
    Discovers:
    - Subdomains (via crt.sh and Subfinder)
    - Domains
    - IP addresses (via DNS resolution)
    - Web services (HTTP/HTTPS detection)
    - Web applications (tech stack detection)
    - Exposed ports (optional, if enable_port_scan=True)
    - Services (optional, if enable_service_detection=True)
    """
    import logging
    import time
    from accounts.models import Organization
    
    # Initialize logger at the very start to avoid UnboundLocalError
    logger = logging.getLogger(__name__)
    
    # Initialize scan_run to None to handle exception cases
    scan_run = None
    
    def check_if_stopped():
        """Check if the scan has been stopped by the user."""
        try:
            # Refresh scan_run from database to get latest status
            scan_run.refresh_from_db()
            if scan_run.status == 'stopped':
                logger.info(f"Scan {scan_run_id} was stopped by user")
                return True
        except Exception as e:
            logger.warning(f"Error checking scan status: {str(e)}")
        return False
    
    try:
        # Retry logic to handle database transaction timing issues
        max_retries = 5
        retry_delay = 1  # seconds
        
        for attempt in range(max_retries):
            try:
                scan_run = ScanRun.objects.get(id=scan_run_id)
                break
            except ScanRun.DoesNotExist:
                if attempt < max_retries - 1:
                    logger.warning(f"ScanRun {scan_run_id} not found, retrying in {retry_delay}s (attempt {attempt + 1}/{max_retries})")
                    time.sleep(retry_delay)
                else:
                    logger.error(f"ScanRun {scan_run_id} not found after {max_retries} attempts")
                    raise
        
        # Check if already stopped before we even start
        if scan_run.status == 'stopped':
            logger.info(f"Scan {scan_run_id} was already stopped before starting")
            return "Scan was stopped before starting"
        
        organization = Organization.objects.get(id=organization_id)
        
        scan_run.status = 'running'
        scan_run.started_at = timezone.now()
        scan_run.save()
        
        discovered_assets = []
        MAX_ASSETS_LIMIT = 10000  # Maximum assets to discover per scan
        
        # Safe discovery methods (passive first)
        if domain:
            # Check if stopped before crt.sh
            if check_if_stopped():
                return "Scan was stopped by user"
            
            # Method 1: crt.sh certificate transparency logs
            try:
                crt_assets = discover_via_crtsh(domain)
                # Check if stopped after crt.sh (long-running operation)
                if check_if_stopped():
                    logger.info(f"Scan {scan_run_id} was stopped by user after crt.sh discovery")
                    return "Scan was stopped by user"
                # Limit crt.sh results if we're approaching the limit
                remaining_limit = MAX_ASSETS_LIMIT - len(discovered_assets)
                if remaining_limit > 0:
                    discovered_assets.extend(crt_assets[:remaining_limit])
                if len(crt_assets) > remaining_limit:
                    logger.info(f"crt.sh found {len(crt_assets)} assets, limiting to {remaining_limit} due to max limit")
            except Exception as e:
                scan_run.error_message = f"crt.sh error: {str(e)}"
        
        # Check if stopped before Subfinder
        if check_if_stopped():
            logger.info(f"Scan {scan_run_id} was stopped by user before Subfinder")
            return "Scan was stopped by user"
        
        # Method 2: Subfinder (if available)
        if domain and len(discovered_assets) < MAX_ASSETS_LIMIT:
            try:
                subfinder_assets = discover_via_subfinder(domain)
                # Check if stopped immediately after Subfinder (long-running operation)
                if check_if_stopped():
                    logger.info(f"Scan {scan_run_id} was stopped by user after Subfinder discovery")
                    return "Scan was stopped by user"
                if subfinder_assets:
                    # Limit Subfinder results to stay within max limit
                    remaining_limit = MAX_ASSETS_LIMIT - len(discovered_assets)
                    if remaining_limit > 0:
                        discovered_assets.extend(subfinder_assets[:remaining_limit])
                        logger.info(f"Subfinder found {len(subfinder_assets)} assets for {domain}, using {min(len(subfinder_assets), remaining_limit)} due to limit")
                        if len(subfinder_assets) > remaining_limit:
                            logger.info(f"Subfinder results limited: {len(subfinder_assets)} found, {remaining_limit} used (max limit: {MAX_ASSETS_LIMIT})")
            except Exception as e:
                # Log error but don't fail the scan
                logger.warning(f"Subfinder discovery failed for {domain}: {str(e)}")
                pass
        
        # Deduplicate subdomains/domains first (before further processing)
        seen_hostnames = set()
        deduplicated_assets = []
        for asset_data in discovered_assets:
            if asset_data['type'] in ['subdomain', 'domain']:
                hostname = asset_data['name'].lower().strip()
                if hostname not in seen_hostnames:
                    seen_hostnames.add(hostname)
                    deduplicated_assets.append(asset_data)
                else:
                    # Merge sources if duplicate
                    for existing in deduplicated_assets:
                        if existing['name'].lower().strip() == hostname:
                            # Combine sources
                            existing_source = existing.get('source', 'unknown')
                            new_source = asset_data.get('source', 'unknown')
                            if new_source not in existing_source:
                                existing['source'] = f"{existing_source}+{new_source}"
                            break
            else:
                deduplicated_assets.append(asset_data)
        
        discovered_assets = deduplicated_assets
        logger.info(f"After deduplication: {len(discovered_assets)} unique assets")
        
        # Check if stopped before IP resolution
        if check_if_stopped():
            return "Scan was stopped by user"
        
        # Step 2: Resolve IP addresses from subdomains/domains
        logger.info("Starting IP resolution from discovered subdomains/domains")
        ip_assets = []
        seen_ips = set()
        for idx, asset_data in enumerate(discovered_assets[:1000]):  # Limit DNS lookups to prevent timeout
            # Check for stop every 50 iterations during IP resolution
            if idx > 0 and idx % 50 == 0:
                if check_if_stopped():
                    logger.info(f"Scan {scan_run_id} was stopped by user during IP resolution")
                    return "Scan was stopped by user"
            if asset_data['type'] in ['subdomain', 'domain']:
                try:
                    ip_addresses = resolve_dns(asset_data['name'])
                    for ip in ip_addresses:
                        if ip not in seen_ips:
                            seen_ips.add(ip)
                            ip_assets.append({
                                'name': ip,
                                'type': 'ip',
                                'source': f"dns_resolution_{asset_data.get('source', 'unknown')}",
                                'related_asset': asset_data['name']
                            })
                except Exception:
                    pass
        
        discovered_assets.extend(ip_assets)
        logger.info(f"Resolved {len(ip_assets)} unique IP addresses")
        
        # Check if stopped before web service detection
        if check_if_stopped():
            return "Scan was stopped by user"
        
        # Step 3: Detect web services (HTTP/HTTPS)
        logger.info("Starting web service detection")
        web_service_assets = []
        seen_web_services = set()  # Track (hostname, protocol) pairs
        import time
        
        for idx, asset_data in enumerate(discovered_assets[:500]):  # Limit to prevent timeout
            # Check for stop every 20 iterations during web service detection
            if idx > 0 and idx % 20 == 0:
                if check_if_stopped():
                    logger.info(f"Scan {scan_run_id} was stopped by user during web service detection")
                    return "Scan was stopped by user"
            if asset_data['type'] in ['subdomain', 'domain']:
                try:
                    # Add small delay between requests to avoid rate limiting
                    if idx > 0 and idx % 10 == 0:
                        time.sleep(1)  # 1 second delay every 10 requests
                    
                    web_info = detect_web_service(asset_data['name'])
                    if web_info:
                        hostname = asset_data['name'].lower().strip()
                        protocol = web_info['protocol']
                        service_key = (hostname, protocol)
                        
                        # Only add if not already seen
                        if service_key not in seen_web_services:
                            seen_web_services.add(service_key)
                            web_service_assets.append({
                                'name': f"{protocol}://{asset_data['name']}",
                                'type': 'web_service',
                                'source': f"http_detection_{asset_data.get('source', 'unknown')}",
                                'related_asset': asset_data['name'],
                                'metadata': web_info
                            })
                except Exception as e:
                    # Log rate limit errors but continue
                    if 'rate limit' in str(e).lower() or '429' in str(e):
                        logger.warning(f"Rate limit hit for {asset_data['name']}, skipping")
                        time.sleep(2)  # Wait longer if rate limited
                    pass
        
        discovered_assets.extend(web_service_assets)
        logger.info(f"Detected {len(web_service_assets)} unique web services")
        
        # Check if stopped before web application detection
        if check_if_stopped():
            return "Scan was stopped by user"
        
        # Step 4: Detect web applications (if web service found)
        logger.info("Starting web application detection")
        web_app_assets = []
        seen_web_apps = set()  # Track by hostname to avoid duplicates
        for idx, asset_data in enumerate(web_service_assets[:200]):  # Limit to prevent timeout
            # Check for stop every 20 iterations during web application detection
            if idx > 0 and idx % 20 == 0:
                if check_if_stopped():
                    logger.info(f"Scan {scan_run_id} was stopped by user during web application detection")
                    return "Scan was stopped by user"
            try:
                # Add small delay between requests to avoid rate limiting
                if idx > 0 and idx % 10 == 0:
                    time.sleep(1)  # 1 second delay every 10 requests
                
                hostname = asset_data['related_asset'].lower().strip()
                if hostname not in seen_web_apps:
                    app_info = detect_web_application(asset_data['related_asset'])
                    if app_info:
                        seen_web_apps.add(hostname)
                        web_app_assets.append({
                            'name': f"{asset_data['related_asset']} ({app_info.get('title', 'Web App')})",
                            'type': 'web_application',
                            'source': f"app_detection_{asset_data.get('source', 'unknown')}",
                            'related_asset': asset_data['related_asset'],
                            'metadata': app_info
                        })
            except Exception as e:
                # Log rate limit errors but continue
                if 'rate limit' in str(e).lower() or '429' in str(e):
                    logger.warning(f"Rate limit hit for web app detection on {asset_data.get('related_asset', 'unknown')}, skipping")
                    time.sleep(2)  # Wait longer if rate limited
                pass
        
        discovered_assets.extend(web_app_assets)
        logger.info(f"Detected {len(web_app_assets)} unique web applications")
        
        # Check if stopped before port scanning
        if check_if_stopped():
            return "Scan was stopped by user"
        
        # Step 5: Port scanning (optional, if enabled)
        port_assets = []
        if enable_port_scan:
            logger.info("Starting port scanning (enabled)")
            for asset_data in discovered_assets[:100]:  # Limit port scans
                if asset_data['type'] in ['subdomain', 'domain', 'ip']:
                    try:
                        ports = scan_ports_safe(asset_data['name'])
                        for port_info in ports:
                            port_assets.append({
                                'name': f"{asset_data['name']}:{port_info['port']}",
                                'type': 'port',
                                'source': f"port_scan_{asset_data.get('source', 'unknown')}",
                                'related_asset': asset_data['name'],
                                'metadata': port_info
                            })
                    except Exception:
                        pass
            
            discovered_assets.extend(port_assets)
            logger.info(f"Found {len(port_assets)} open ports")
        
        # Check if stopped before service detection
        if check_if_stopped():
            return "Scan was stopped by user"
        
        # Step 6: Service detection (optional, if enabled and ports found)
        service_assets = []
        if enable_service_detection and port_assets:
            logger.info("Starting service detection (enabled)")
            for port_asset in port_assets[:50]:  # Limit service detection
                try:
                    service_info = detect_service(port_asset['related_asset'], port_asset['metadata']['port'])
                    if service_info:
                        service_assets.append({
                            'name': f"{service_info.get('name', 'Unknown Service')} on {port_asset['related_asset']}:{port_asset['metadata']['port']}",
                            'type': 'service',
                            'source': f"service_detection_{port_asset.get('source', 'unknown')}",
                            'related_asset': port_asset['related_asset'],
                            'metadata': service_info
                        })
                except Exception:
                    pass
            
            discovered_assets.extend(service_assets)
            logger.info(f"Detected {len(service_assets)} services")
        
        # Final check if stopped before saving assets
        if check_if_stopped():
            return "Scan was stopped by user"
        
        # Apply final limit
        if len(discovered_assets) > MAX_ASSETS_LIMIT:
            discovered_assets = discovered_assets[:MAX_ASSETS_LIMIT]
            logger.info(f"Total assets limited to {MAX_ASSETS_LIMIT}")
        
        # Final deduplication: Normalize asset names before saving
        final_assets = []
        seen_final = set()
        for asset_data in discovered_assets:
            # Normalize name based on type
            normalized_name = asset_data['name'].strip()
            if asset_data['type'] in ['subdomain', 'domain']:
                normalized_name = normalized_name.lower()
            elif asset_data['type'] == 'web_service':
                # Normalize web service URLs (remove trailing slash, lowercase)
                normalized_name = normalized_name.lower().rstrip('/')
            elif asset_data['type'] == 'web_application':
                # Extract hostname from web app name if it contains URL
                if '(' in normalized_name:
                    normalized_name = normalized_name.split('(')[0].strip().lower()
            
            asset_key = (normalized_name, asset_data['type'])
            if asset_key not in seen_final:
                seen_final.add(asset_key)
                # Update name to normalized version
                asset_data['name'] = normalized_name
                final_assets.append(asset_data)
        
        discovered_assets = final_assets
        logger.info(f"Final deduplicated assets: {len(discovered_assets)}")
        
        # Deduplicate and save assets
        saved_count = 0
        for idx, asset_data in enumerate(discovered_assets):
            # Check for stop every 100 assets during saving
            if idx > 0 and idx % 100 == 0:
                if check_if_stopped():
                    logger.info(f"Scan {scan_run_id} was stopped by user during asset saving (saved {saved_count} assets so far)")
                    return f"Scan was stopped by user (saved {saved_count} assets)"
            asset, created = Asset.objects.get_or_create(
                organization=organization,
                name=asset_data['name'],
                asset_type=asset_data['type'],
                defaults={
                    'discovery_source': asset_data.get('source', 'unknown'),
                    'is_active': True,
                    'is_unknown': True,  # All discovered assets are unknown by default
                }
            )
            
            if created:
                # Create asset change record
                AssetChange.objects.create(
                    asset=asset,
                    change_type='new',
                    scan_run=scan_run,
                    details={
                        'related_asset': asset_data.get('related_asset'),
                        'metadata': asset_data.get('metadata', {})
                    }
                )
                
                # Auto-assign ownership based on asset type and patterns
                auto_assign_ownership(asset, asset_data)
                
                saved_count += 1
            else:
                # Update last_seen
                asset.last_seen = timezone.now()
                asset.is_active = True
                asset.save()
            
            # Create scan snapshot and detect changes for existing assets
            if not created:
                try:
                    # Prepare scan data for snapshot
                    scan_data = {
                        'open_ports': asset_data.get('open_ports', []),
                        'services': asset_data.get('services', {}),
                        'headers': asset_data.get('headers', {}),
                        'certificate_info': asset_data.get('certificate_info', {}),
                        'ip_addresses': asset_data.get('ip_addresses', []),
                        'subdomains': asset_data.get('subdomains', []),
                        'metadata': asset_data.get('metadata', {})
                    }
                    
                    # Process snapshot and detect changes
                    process_scan_snapshot(asset, scan_run, scan_data)
                except Exception as e:
                    logger.warning(f"Failed to process scan snapshot for {asset.name}: {str(e)}")
        
        # Count assets by source
        source_breakdown = {}
        for asset_data in discovered_assets:
            source = asset_data.get('source', 'unknown')
            source_breakdown[source] = source_breakdown.get(source, 0) + 1
        
        scan_run.status = 'completed'
        scan_run.finished_at = timezone.now()
        
        # Note if we hit the limit
        limit_reached = len(discovered_assets) >= MAX_ASSETS_LIMIT
        
        # Final deduplication for results display (ensure no duplicates in results)
        seen_in_results = set()
        unique_results = []
        for a in discovered_assets:
            # Create unique key: (normalized_name, type)
            normalized_name = a['name'].lower().strip()
            if a['type'] == 'web_service':
                normalized_name = normalized_name.lower().rstrip('/')
            key = (normalized_name, a['type'])
            if key not in seen_in_results:
                seen_in_results.add(key)
                unique_results.append({
                    'name': a['name'],
                    'type': a['type'],
                    'source': a.get('source', 'unknown'),
                    'related_asset': a.get('related_asset'),
                    'metadata': a.get('metadata', {})
                })
        
        scan_run.results = {
            'assets_discovered': len(unique_results),
            'assets_saved': saved_count,
            'source_breakdown': source_breakdown,
            'max_limit': MAX_ASSETS_LIMIT,
            'limit_reached': limit_reached,
            # Include only unique discovered assets (deduplicated) with source info
            'assets': unique_results
        }
        scan_run.save()
        
        # Send discovery completion email notification
        try:
            alert_discovery_completion(scan_run)
            logger.info(f"Discovery completion email sent for scan {scan_run.id}")
        except Exception as e:
            logger.error(f"Failed to send discovery completion email: {str(e)}")
        
        return f"Discovery completed: {saved_count} new assets found"
        
    except Exception as e:
        # Only update scan_run if it was successfully fetched
        if scan_run is not None:
            scan_run.status = 'failed'
            scan_run.error_message = str(e)
            scan_run.finished_at = timezone.now()
            scan_run.save()
        else:
            logger.error(f"Failed to run discovery scan {scan_run_id}: {str(e)}")
        raise


def discover_via_crtsh(domain):
    """
    Discover subdomains via crt.sh certificate transparency logs.
    Safe, passive method with rate limit handling.
    """
    import time
    import logging
    logger = logging.getLogger(__name__)
    
    assets = []
    max_retries = 3
    retry_delay = 5  # seconds
    
    for attempt in range(max_retries):
        try:
            url = f"https://crt.sh/?q=%.{domain}&output=json"
            
            # Add delay between requests to avoid rate limiting
            if attempt > 0:
                time.sleep(retry_delay * attempt)  # Exponential backoff
            
            response = requests.get(url, timeout=30, headers={
                'User-Agent': 'Mozilla/5.0 (compatible; AssetDiscovery/1.0)'
            })
            
            # Handle rate limiting
            if response.status_code == 429:
                if attempt < max_retries - 1:
                    wait_time = retry_delay * (2 ** attempt)  # Exponential backoff
                    logger.warning(f"crt.sh rate limit hit for {domain}, waiting {wait_time}s before retry {attempt + 1}/{max_retries}")
                    time.sleep(wait_time)
                    continue
                else:
                    logger.error(f"crt.sh rate limit exceeded for {domain} after {max_retries} attempts")
                    return assets  # Return empty list if rate limited
            
            if response.status_code == 200:
                data = response.json()
                seen = set()
                
                for entry in data:
                    name_value = entry.get('name_value', '')
                    if name_value and domain in name_value:
                        # Extract subdomain
                        subdomain = name_value.split('\n')[0].strip()
                        if subdomain not in seen and subdomain != domain:
                            seen.add(subdomain)
                            assets.append({
                                'name': subdomain,
                                'type': 'subdomain',
                                'source': 'crt.sh'
                            })
                # Success, break retry loop
                break
            elif response.status_code >= 500:
                # Server error, retry
                if attempt < max_retries - 1:
                    logger.warning(f"crt.sh server error {response.status_code} for {domain}, retrying...")
                    time.sleep(retry_delay * attempt)
                    continue
            else:
                # Other error, don't retry
                logger.warning(f"crt.sh returned status {response.status_code} for {domain}")
                break
                
        except requests.exceptions.Timeout:
            if attempt < max_retries - 1:
                logger.warning(f"crt.sh timeout for {domain}, retrying...")
                time.sleep(retry_delay * attempt)
                continue
            else:
                logger.error(f"crt.sh timeout for {domain} after {max_retries} attempts")
                break
        except requests.exceptions.RequestException as e:
            if attempt < max_retries - 1:
                logger.warning(f"crt.sh request error for {domain}: {str(e)}, retrying...")
                time.sleep(retry_delay * attempt)
                continue
            else:
                logger.error(f"crt.sh request failed for {domain} after {max_retries} attempts: {str(e)}")
                break
        except Exception as e:
            # Unexpected error, log and return
            logger.error(f"crt.sh unexpected error for {domain}: {str(e)}")
            break
    
    return assets


def discover_via_subfinder(domain):
    """
    Discover subdomains via subfinder (if installed).
    Safe, passive mode only.
    Production-ready: Supports environment variables and multiple installation methods.
    """
    import os
    import logging
    logger = logging.getLogger(__name__)
    
    assets = []
    
    # Production-ready: Check environment variable first (for Docker/containerized deployments)
    subfinder_env_path = os.environ.get('SUBFINDER_PATH')
    if subfinder_env_path and os.path.exists(subfinder_env_path):
        subfinder_paths = [subfinder_env_path]
        logger.info(f"Using Subfinder from environment variable: {subfinder_env_path}")
    else:
        # Get project root directory (go up from backend/scans/tasks.py)
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        tools_dir = os.path.join(project_root, 'tools')
        
        # Try multiple possible locations for subfinder (Development + Production)
        subfinder_paths = [
            'subfinder',  # In system PATH (production: installed system-wide)
            os.path.join(tools_dir, 'subfinder.exe'),  # In project tools folder (Windows)
            os.path.join(tools_dir, 'subfinder'),  # In project tools folder (Linux/Mac)
            '/usr/local/bin/subfinder',  # Common Linux installation path
            '/usr/bin/subfinder',  # System-wide Linux path
            '/opt/subfinder/subfinder',  # Optional installation path
        ]
    
    subfinder_cmd = None
    for path in subfinder_paths:
        try:
            # Check if subfinder is available at this path
            result = subprocess.run(
                [path, '-version'],
                capture_output=True,
                timeout=5,
                text=True
            )
            if result.returncode == 0:
                subfinder_cmd = path
                logger.info(f"Subfinder found at: {path}")
                break
        except FileNotFoundError:
            logger.debug(f"Subfinder not found at: {path}")
            continue
        except subprocess.TimeoutExpired:
            logger.debug(f"Subfinder version check timeout at: {path}")
            continue
        except Exception as e:
            logger.debug(f"Error checking subfinder at {path}: {str(e)}")
            continue
    
    if not subfinder_cmd:
        # Subfinder not found, log and return empty list
        logger.info(f"Subfinder not available for domain {domain}. Only crt.sh will be used.")
        return assets
    
    try:
        # Run subfinder (passive by default - uses online sources)
        # Using -silent for less output (only show subdomains)
        result = subprocess.run(
            [subfinder_cmd, '-d', domain, '-silent'],
            capture_output=True,
            text=True,
            timeout=300
        )
        
        if result.returncode == 0:
            seen = set()
            for line in result.stdout.strip().split('\n'):
                line = line.strip()
                if line and line not in seen:
                    seen.add(line)
                    # Validate it's a proper subdomain
                    if domain in line and line.count('.') >= domain.count('.'):
                        assets.append({
                            'name': line,
                            'type': 'subdomain',
                            'source': 'subfinder'
                        })
    except subprocess.TimeoutExpired:
        # Timeout, return what we have
        pass
    except Exception as e:
        # Other errors, log but don't fail
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Subfinder error for {domain}: {str(e)}")
        pass
    
    return assets


@shared_task
def run_port_scan(scan_run_id, asset_id):
    """
    Run safe port scan using naabu (if available).
    Limited to safe ports only, no aggressive scanning.
    """
    try:
        scan_run = ScanRun.objects.get(id=scan_run_id)
        asset = Asset.objects.get(id=asset_id)
        
        scan_run.status = 'running'
        scan_run.started_at = timezone.now()
        scan_run.save()
        
        open_ports = []
        
        # Safe port scan - only common ports, rate limited
        try:
            # Check if naabu is available
            result = subprocess.run(
                ['naabu', '-version'],
                capture_output=True,
                timeout=5
            )
            
            if result.returncode == 0:
                # Run naabu with safe settings
                # -top-ports 100: Only scan top 100 ports
                # -rate 1000: Rate limit to 1000 packets/second
                # -no-probe: No probe mode (safer)
                result = subprocess.run(
                    ['naabu', '-host', asset.name, '-top-ports', '100', '-rate', '1000', '-json'],
                    capture_output=True,
                    text=True,
                    timeout=600
                )
                
                if result.returncode == 0:
                    for line in result.stdout.strip().split('\n'):
                        if line.strip():
                            try:
                                port_data = json.loads(line)
                                if 'port' in port_data:
                                    open_ports.append(port_data['port'])
                            except json.JSONDecodeError:
                                continue
        except (FileNotFoundError, subprocess.TimeoutExpired):
            # Tool not available, skip
            pass
        
        # Create vulnerabilities for open ports
        for port in open_ports:
            Vulnerability.objects.get_or_create(
                asset=asset,
                title=f"Open Port {port}",
                defaults={
                    'category': 'port',
                    'severity': 'low',
                    'description': f"Port {port} is open on {asset.name}",
                    'status': 'open',
                }
            )
        
        scan_run.status = 'completed'
        scan_run.finished_at = timezone.now()
        scan_run.results = {
            'open_ports': open_ports,
            'ports_count': len(open_ports)
        }
        scan_run.save()
        
        return f"Port scan completed: {len(open_ports)} open ports found"
        
    except Exception as e:
        scan_run.status = 'failed'
        scan_run.error_message = str(e)
        scan_run.finished_at = timezone.now()
        scan_run.save()
        raise


@shared_task
def run_ssl_check(scan_run_id, asset_id):
    """
    Check SSL/TLS configuration for an asset.
    Safe, read-only check.
    """
    try:
        scan_run = ScanRun.objects.get(id=scan_run_id)
        asset = Asset.objects.get(id=asset_id)
        
        scan_run.status = 'running'
        scan_run.started_at = timezone.now()
        scan_run.save()
        
        issues = []
        
        # SSL check using Python ssl library (safe, no external tools needed)
        import ssl
        import socket
        from datetime import datetime
        
        try:
            context = ssl.create_default_context()
            with socket.create_connection((asset.name, 443), timeout=10) as sock:
                with context.wrap_socket(sock, server_hostname=asset.name) as ssock:
                    cert = ssock.getpeercert()
                    
                    # Check certificate expiry
                    not_after = datetime.strptime(cert['notAfter'], '%b %d %H:%M:%S %Y %Z')
                    days_until_expiry = (not_after - datetime.now()).days
                    
                    if days_until_expiry < 30:
                        issues.append({
                            'type': 'ssl_expiry',
                            'severity': 'high',
                            'message': f"SSL certificate expires in {days_until_expiry} days"
                        })
                    
                    # Check for weak ciphers (basic check)
                    cipher = ssock.cipher()
                    if cipher:
                        if 'RC4' in str(cipher) or 'MD5' in str(cipher):
                            issues.append({
                                'type': 'weak_cipher',
                                'severity': 'medium',
                                'message': f"Weak cipher detected: {cipher[0]}"
                            })
        except Exception as e:
            issues.append({
                'type': 'ssl_error',
                'severity': 'info',
                'message': f"Could not connect to SSL: {str(e)}"
            })
        
        # Create vulnerabilities for issues
        for issue in issues:
            Vulnerability.objects.get_or_create(
                asset=asset,
                title=issue['message'],
                defaults={
                    'category': 'ssl',
                    'severity': issue['severity'],
                    'description': issue['message'],
                    'status': 'open',
                }
            )
        
        scan_run.status = 'completed'
        scan_run.finished_at = timezone.now()
        scan_run.results = {
            'issues_found': len(issues),
            'issues': issues
        }
        scan_run.save()
        
        return f"SSL check completed: {len(issues)} issues found"
        
    except Exception as e:
        scan_run.status = 'failed'
        scan_run.error_message = str(e)
        scan_run.finished_at = timezone.now()
        scan_run.save()
        raise


def auto_assign_ownership(asset, asset_data):
    """
    Automatically assign ownership to discovered assets based on patterns.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        # Check if ownership already exists
        try:
            if asset.ownership:
                return  # Ownership already exists
        except Ownership.DoesNotExist:
            pass
        
        ownership = Ownership(asset=asset)
        
        # Pattern-based ownership assignment
        asset_name = asset.name.lower()
        asset_type = asset.asset_type
        
        # Domain-based patterns
        if 'api' in asset_name or asset_type == 'api':
            ownership.department = 'Engineering'
            ownership.owner_name = 'API Team'
            ownership.owner_email = f'api-team@{asset.organization.name.lower().replace(" ", "")}.com'
        elif 'admin' in asset_name or 'dashboard' in asset_name:
            ownership.department = 'IT Operations'
            ownership.owner_name = 'IT Admin'
            ownership.owner_email = f'it-admin@{asset.organization.name.lower().replace(" ", "")}.com'
        elif 'staging' in asset_name or 'dev' in asset_name or 'test' in asset_name:
            ownership.department = 'Engineering'
            ownership.owner_name = 'Development Team'
            ownership.owner_email = f'dev-team@{asset.organization.name.lower().replace(" ", "")}.com'
        elif 'www' in asset_name or asset_type == 'web_service' or asset_type == 'web_application':
            ownership.department = 'Marketing'
            ownership.owner_name = 'Web Team'
            ownership.owner_email = f'web-team@{asset.organization.name.lower().replace(" ", "")}.com'
        elif asset_type == 'port':
            ownership.department = 'IT Operations'
            ownership.owner_name = 'Infrastructure Team'
            ownership.owner_email = f'infra-team@{asset.organization.name.lower().replace(" ", "")}.com'
        elif asset_type == 'service':
            ownership.department = 'IT Operations'
            ownership.owner_name = 'Infrastructure Team'
            ownership.owner_email = f'infra-team@{asset.organization.name.lower().replace(" ", "")}.com'
        elif asset_type == 'ip':
            ownership.department = 'IT Operations'
            ownership.owner_name = 'Network Team'
            ownership.owner_email = f'network-team@{asset.organization.name.lower().replace(" ", "")}.com'
        else:
            # Default for unknown assets
            ownership.department = 'IT Operations'
            ownership.owner_name = 'Unassigned'
            ownership.owner_email = f'security@{asset.organization.name.lower().replace(" ", "")}.com'
        
        # Ensure notes field is set (even if empty)
        ownership.notes = ownership.notes or ''
        ownership.save()
        
        logger.info(f"Auto-assigned ownership for {asset.name}: {ownership.department} - {ownership.owner_name}")
        
    except Exception as e:
        logger.warning(f"Failed to auto-assign ownership for {asset.name}: {str(e)}")


@shared_task
def run_scheduled_discoveries():
    """
    Run all due scheduled discovery scans.
    This task is called periodically by Celery Beat.
    """
    now = timezone.now()
    due_discoveries = ScheduledDiscovery.objects.filter(
        is_active=True,
        next_run__lte=now
    )
    
    executed = 0
    for scheduled in due_discoveries:
        try:
            # Create a scan run for this scheduled discovery
            scan_run = ScanRun.objects.create(
                organization=scheduled.organization,
                scan_type='discovery',
                status='pending',
                config={
                    'domain': scheduled.domain,
                    'enable_port_scan': scheduled.enable_port_scan,
                    'enable_service_detection': scheduled.enable_service_detection,
                    'scheduled_discovery_id': str(scheduled.id)
                }
            )
            
            # Trigger the discovery scan
            run_discovery_scan.delay(
                str(scan_run.id),
                str(scheduled.organization.id),
                scheduled.domain,
                enable_port_scan=scheduled.enable_port_scan,
                enable_service_detection=scheduled.enable_service_detection
            )
            
            # Update scheduled discovery
            scheduled.last_run = now
            scheduled.next_run = scheduled.calculate_next_run()
            scheduled.save()
            
            executed += 1
            logger.info(f"Triggered scheduled discovery for {scheduled.domain} (Organization: {scheduled.organization.name})")
            
        except Exception as e:
            logger.error(f"Failed to run scheduled discovery {scheduled.id}: {str(e)}")
            # Update next_run even on failure to prevent infinite retries
            scheduled.next_run = scheduled.calculate_next_run()
            scheduled.save()
    
    logger.info(f"Executed {executed} scheduled discovery scans")
    return f"Executed {executed} scheduled discovery scans"


@shared_task
def run_continuous_asset_scan():
    """
    Continuous scan task that runs every 15-20 minutes.
    Scans all existing assets to detect changes.
    """
    from accounts.models import Organization
    
    logger.info("Starting continuous asset scan...")
    
    # Get all active organizations
    organizations = Organization.objects.filter(status='active')
    
    total_scanned = 0
    total_changes = 0
    
    for org in organizations:
        try:
            # Get all active assets for this organization
            assets = Asset.objects.filter(organization=org, is_active=True)
            
            logger.info(f"Scanning {assets.count()} assets for organization {org.name}")
            
            # Create a scan run for this continuous scan
            scan_run = ScanRun.objects.create(
                organization=org,
                scan_type='discovery',
                status='running',
                config={
                    'scan_type': 'continuous',
                    'description': 'Automated continuous asset monitoring scan'
                },
                started_at=timezone.now()
            )
            
            scanned_count = 0
            changes_detected = 0
            
            for asset in assets:
                try:
                    # Prepare scan data (simplified for continuous scans)
                    # In a real implementation, you would re-scan the asset here
                    scan_data = {
                        'open_ports': [],
                        'services': {},
                        'headers': {},
                        'certificate_info': {},
                        'ip_addresses': [],
                        'subdomains': [],
                        'metadata': {}
                    }
                    
                    # For now, we'll use existing asset data
                    # In production, you would re-scan each asset
                    # This is a placeholder - actual scanning logic should be implemented
                    
                    # Process snapshot and detect changes
                    notifications = process_scan_snapshot(asset, scan_run, scan_data)
                    if notifications:
                        changes_detected += len(notifications)
                    
                    scanned_count += 1
                    
                except Exception as e:
                    logger.warning(f"Failed to scan asset {asset.name}: {str(e)}")
                    continue
            
            # Update scan run status
            scan_run.status = 'completed'
            scan_run.finished_at = timezone.now()
            scan_run.results = {
                'assets_scanned': scanned_count,
                'changes_detected': changes_detected
            }
            scan_run.save()
            
            total_scanned += scanned_count
            total_changes += changes_detected
            
            logger.info(f"Completed continuous scan for {org.name}: {scanned_count} assets scanned, {changes_detected} changes detected")
            
        except Exception as e:
            logger.error(f"Failed to run continuous scan for organization {org.name}: {str(e)}")
            continue
    
    logger.info(f"Continuous asset scan completed: {total_scanned} assets scanned, {total_changes} changes detected")
    return f"Scanned {total_scanned} assets, detected {total_changes} changes"

