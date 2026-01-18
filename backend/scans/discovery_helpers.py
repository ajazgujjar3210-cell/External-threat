"""
Helper functions for comprehensive asset discovery.
"""
import socket
import requests
import subprocess
import json
import logging
import urllib3
from urllib.parse import urlparse

# Disable SSL warnings for discovery (we use verify=False for self-signed certs)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

logger = logging.getLogger(__name__)


def resolve_dns(hostname):
    """
    Resolve hostname to IP addresses.
    Returns list of IP addresses.
    """
    ip_addresses = []
    try:
        # Try IPv4
        ipv4 = socket.gethostbyname(hostname)
        if ipv4:
            ip_addresses.append(ipv4)
    except socket.gaierror:
        pass
    
    try:
        # Try IPv6 (if available)
        ipv6_info = socket.getaddrinfo(hostname, None, socket.AF_INET6)
        for info in ipv6_info[:2]:  # Limit to 2 IPv6 addresses
            ipv6 = info[4][0]
            if ipv6 not in ip_addresses:
                ip_addresses.append(ipv6)
    except (socket.gaierror, IndexError):
        pass
    
    return ip_addresses


def detect_web_service(hostname):
    """
    Detect if hostname has HTTP/HTTPS service.
    Returns dict with protocol, status_code, headers if found.
    Handles rate limiting gracefully.
    """
    web_info = None
    
    # Try HTTPS first
    try:
        import urllib3
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        response = requests.get(
            f"https://{hostname}",
            timeout=5,
            allow_redirects=True,
            verify=False,  # Accept self-signed certs for discovery
            headers={'User-Agent': 'Mozilla/5.0 (compatible; AssetDiscovery/1.0)'}
        )
        
        # Check for rate limiting
        if response.status_code == 429:
            logger.debug(f"Rate limit hit for HTTPS on {hostname}")
            return None
            
        web_info = {
            'protocol': 'https',
            'status_code': response.status_code,
            'server': response.headers.get('Server', ''),
            'title': extract_title(response.text),
        }
    except requests.exceptions.HTTPError as e:
        if e.response and e.response.status_code == 429:
            logger.debug(f"Rate limit hit for HTTPS on {hostname}")
            return None
    except (requests.exceptions.RequestException, requests.exceptions.SSLError):
        # Try HTTP
        try:
            response = requests.get(
                f"http://{hostname}",
                timeout=5,
                allow_redirects=True,
                headers={'User-Agent': 'Mozilla/5.0 (compatible; AssetDiscovery/1.0)'}
            )
            
            # Check for rate limiting
            if response.status_code == 429:
                logger.debug(f"Rate limit hit for HTTP on {hostname}")
                return None
                
            web_info = {
                'protocol': 'http',
                'status_code': response.status_code,
                'server': response.headers.get('Server', ''),
                'title': extract_title(response.text),
            }
        except requests.exceptions.HTTPError as e:
            if e.response and e.response.status_code == 429:
                logger.debug(f"Rate limit hit for HTTP on {hostname}")
                return None
        except requests.exceptions.RequestException:
            pass
    
    return web_info


def extract_title(html_content):
    """Extract page title from HTML."""
    try:
        import re
        match = re.search(r'<title[^>]*>([^<]+)</title>', html_content, re.IGNORECASE)
        if match:
            return match.group(1).strip()[:100]  # Limit to 100 chars
    except Exception:
        pass
    return ''


def detect_web_application(hostname):
    """
    Detect web application technology stack.
    Returns dict with detected technologies.
    Handles rate limiting gracefully.
    """
    app_info = {}
    
    try:
        # Try HTTPS first
        try:
            response = requests.get(
                f"https://{hostname}",
                timeout=5,
                allow_redirects=True,
                verify=False,
                headers={'User-Agent': 'Mozilla/5.0 (compatible; AssetDiscovery/1.0)'}
            )
            
            # Check for rate limiting
            if response.status_code == 429:
                logger.debug(f"Rate limit hit for web app detection on {hostname}")
                return None
                
        except requests.exceptions.HTTPError as e:
            if e.response and e.response.status_code == 429:
                logger.debug(f"Rate limit hit for HTTPS web app detection on {hostname}")
                return None
        except (requests.exceptions.RequestException, requests.exceptions.SSLError):
            # Try HTTP
            try:
                response = requests.get(
                    f"http://{hostname}",
                    timeout=5,
                    allow_redirects=True,
                    headers={'User-Agent': 'Mozilla/5.0 (compatible; AssetDiscovery/1.0)'}
                )
                
                # Check for rate limiting
                if response.status_code == 429:
                    logger.debug(f"Rate limit hit for HTTP web app detection on {hostname}")
                    return None
            except requests.exceptions.HTTPError as e:
                if e.response and e.response.status_code == 429:
                    logger.debug(f"Rate limit hit for HTTP web app detection on {hostname}")
                    return None
                raise
        
        # Extract technologies from headers and content
        headers = response.headers
        
        # Server header
        if 'Server' in headers:
            app_info['server'] = headers['Server']
        
        # X-Powered-By header (PHP, ASP.NET, etc.)
        if 'X-Powered-By' in headers:
            app_info['powered_by'] = headers['X-Powered-By']
        
        # Content-Type
        if 'Content-Type' in headers:
            app_info['content_type'] = headers['Content-Type']
        
        # Detect from HTML content
        content = response.text[:5000]  # First 5KB
        
        # Common frameworks
        if 'wp-content' in content or 'wp-includes' in content:
            app_info['framework'] = 'WordPress'
        elif 'drupal' in content.lower():
            app_info['framework'] = 'Drupal'
        elif 'joomla' in content.lower():
            app_info['framework'] = 'Joomla'
        elif 'react' in content.lower() or 'reactjs' in content.lower():
            app_info['framework'] = 'React'
        elif 'angular' in content.lower():
            app_info['framework'] = 'Angular'
        elif 'vue' in content.lower():
            app_info['framework'] = 'Vue.js'
        
        # Page title
        title = extract_title(content)
        if title:
            app_info['title'] = title
        
        app_info['status_code'] = response.status_code
        
    except requests.exceptions.RequestException:
        pass
    
    return app_info if app_info else None


def scan_ports_safe(hostname, ports=None):
    """
    Safe port scanning - only common ports, rate limited.
    Returns list of dicts with port info.
    """
    open_ports = []
    
    # Default to common ports if not specified
    if ports is None:
        ports = [80, 443, 22, 21, 25, 53, 110, 143, 993, 995, 3306, 5432, 8080, 8443, 3389, 5900]
    
    # Check if naabu is available (preferred method)
    naabu_paths = [
        'naabu',
        'tools/naabu.exe',
        'tools/naabu',
    ]
    
    naabu_cmd = None
    for path in naabu_paths:
        try:
            result = subprocess.run(
                [path, '-version'],
                capture_output=True,
                timeout=5
            )
            if result.returncode == 0:
                naabu_cmd = path
                break
        except (FileNotFoundError, subprocess.TimeoutExpired):
            continue
    
    if naabu_cmd:
        # Use naabu for port scanning
        try:
            ports_str = ','.join(map(str, ports))
            result = subprocess.run(
                [naabu_cmd, '-host', hostname, '-p', ports_str, '-rate', '100', '-json', '-silent'],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                for line in result.stdout.strip().split('\n'):
                    if line.strip():
                        try:
                            port_data = json.loads(line)
                            if 'port' in port_data:
                                open_ports.append({
                                    'port': port_data['port'],
                                    'service': port_data.get('service', 'unknown'),
                                })
                        except json.JSONDecodeError:
                            continue
        except (subprocess.TimeoutExpired, Exception) as e:
            logger.debug(f"Naabu port scan failed for {hostname}: {str(e)}")
    else:
        # Fallback to Python socket scanning (slower but works)
        for port in ports[:20]:  # Limit to 20 ports for socket scanning
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(1)
                result = sock.connect_ex((hostname, port))
                sock.close()
                
                if result == 0:
                    # Port is open, try to detect service
                    service = detect_service_simple(port)
                    open_ports.append({
                        'port': port,
                        'service': service,
                    })
            except Exception:
                pass
    
    return open_ports


def detect_service_simple(port):
    """Simple service detection based on common ports."""
    port_services = {
        21: 'FTP',
        22: 'SSH',
        23: 'Telnet',
        25: 'SMTP',
        53: 'DNS',
        80: 'HTTP',
        110: 'POP3',
        143: 'IMAP',
        443: 'HTTPS',
        3306: 'MySQL',
        5432: 'PostgreSQL',
        8080: 'HTTP-Proxy',
        8443: 'HTTPS-Alt',
        3389: 'RDP',
        5900: 'VNC',
    }
    return port_services.get(port, 'unknown')


def detect_service(hostname, port):
    """
    Detect service running on a specific port.
    Returns dict with service information.
    """
    service_info = {
        'port': port,
        'name': detect_service_simple(port),
    }
    
    # Try to get more info via banner grabbing (safe, timeout-limited)
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2)
        sock.connect((hostname, port))
        
        # Try to receive banner
        try:
            banner = sock.recv(1024).decode('utf-8', errors='ignore')[:200]
            if banner:
                service_info['banner'] = banner.strip()
        except Exception:
            pass
        
        sock.close()
    except Exception:
        pass
    
    # HTTP/HTTPS specific detection
    if port in [80, 443, 8080, 8443]:
        try:
            protocol = 'https' if port in [443, 8443] else 'http'
            url = f"{protocol}://{hostname}:{port}"
            response = requests.get(url, timeout=3, verify=False, allow_redirects=True)
            
            service_info['http_status'] = response.status_code
            if 'Server' in response.headers:
                service_info['server'] = response.headers['Server']
        except Exception:
            pass
    
    return service_info

