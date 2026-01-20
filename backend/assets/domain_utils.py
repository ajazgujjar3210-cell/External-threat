"""
Domain extraction and grouping utilities.
"""
import re
from urllib.parse import urlparse
from collections import defaultdict


def extract_domain(asset_name, asset_type):
    """
    Extract root domain from asset name based on asset type.
    
    Args:
        asset_name: Name of the asset (e.g., 'subdomain.example.com', 'https://api.example.com')
        asset_type: Type of asset (domain, subdomain, ip, etc.)
    
    Returns:
        Root domain string or None if extraction fails
    """
    if not asset_name:
        return None
    
    # For IP addresses, return None (no domain)
    if asset_type == 'ip':
        return None
    
    # For domains and subdomains
    if asset_type in ['domain', 'subdomain']:
        # Remove protocol if present
        if '://' in asset_name:
            parsed = urlparse(asset_name)
            domain = parsed.netloc or parsed.path
        else:
            domain = asset_name
        
        # Remove port if present
        if ':' in domain:
            domain = domain.split(':')[0]
        
        # Remove path if present
        domain = domain.split('/')[0]
        
        # Extract root domain (e.g., 'example.com' from 'subdomain.example.com')
        parts = domain.split('.')
        if len(parts) >= 2:
            # Take last two parts for root domain
            return '.'.join(parts[-2:])
        return domain
    
    # For web services and applications, try to extract domain
    if asset_type in ['web_service', 'web_application', 'api']:
        # Try to parse as URL
        if '://' in asset_name:
            parsed = urlparse(asset_name)
            domain = parsed.netloc or parsed.path
        else:
            domain = asset_name
        
        # Remove port
        if ':' in domain:
            domain = domain.split(':')[0]
        
        # Remove path
        domain = domain.split('/')[0]
        
        # Extract root domain
        parts = domain.split('.')
        if len(parts) >= 2:
            return '.'.join(parts[-2:])
        return domain
    
    return None


def group_assets_by_domain(assets):
    """
    Group assets by their root domain.
    
    Args:
        assets: QuerySet or list of Asset objects
    
    Returns:
        Dictionary mapping domain -> list of assets
    """
    domain_groups = defaultdict(list)
    no_domain = []
    
    for asset in assets:
        domain = extract_domain(asset.name, asset.asset_type)
        if domain:
            domain_groups[domain].append(asset)
        else:
            no_domain.append(asset)
    
    # Add assets without domain to a special group
    if no_domain:
        domain_groups['_no_domain'] = no_domain
    
    return dict(domain_groups)


def get_domain_hierarchy(assets):
    """
    Build a domain hierarchy showing parent-child relationships.
    
    Args:
        assets: QuerySet or list of Asset objects
    
    Returns:
        Dictionary with domain hierarchy structure
    """
    domain_groups = group_assets_by_domain(assets)
    hierarchy = {}
    
    for domain, domain_assets in domain_groups.items():
        if domain == '_no_domain':
            continue
        
        # Separate root domain from subdomains
        root_domain_assets = []
        subdomain_assets = []
        
        for asset in domain_assets:
            asset_domain = extract_domain(asset.name, asset.asset_type)
            if asset_domain == domain and asset.asset_type == 'domain':
                root_domain_assets.append(asset)
            else:
                subdomain_assets.append(asset)
        
        hierarchy[domain] = {
            'root_domain': domain,
            'root_domain_assets': root_domain_assets,
            'subdomains': subdomain_assets,
            'total_assets': len(domain_assets),
            'asset_types': {}
        }
        
        # Count by asset type
        for asset in domain_assets:
            asset_type = asset.asset_type
            if asset_type not in hierarchy[domain]['asset_types']:
                hierarchy[domain]['asset_types'][asset_type] = 0
            hierarchy[domain]['asset_types'][asset_type] += 1
    
    return hierarchy

