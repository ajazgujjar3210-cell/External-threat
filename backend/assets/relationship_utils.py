"""
Asset relationship utilities for visualization.
"""
from collections import defaultdict


def build_asset_relationships(assets):
    """
    Build relationship graph between assets.
    
    Relationships:
    - Subdomain -> Domain (parent domain)
    - IP -> Domain/Subdomain (resolved IPs)
    - Web Service -> Domain/Subdomain (hosted on)
    - Port -> IP (port on IP)
    - Service -> Port (service on port)
    
    Args:
        assets: QuerySet or list of Asset objects
    
    Returns:
        Dictionary with relationship structure for visualization
    """
    from .domain_utils import extract_domain
    
    relationships = {
        'nodes': [],
        'edges': [],
        'groups': defaultdict(list)
    }
    
    # Build node map
    node_map = {}
    domain_map = defaultdict(list)
    
    for asset in assets:
        node_id = str(asset.id)
        node_map[node_id] = asset
        
        # Extract domain for grouping
        domain = extract_domain(asset.name, asset.asset_type)
        if domain:
            domain_map[domain].append(asset)
        
        relationships['nodes'].append({
            'id': node_id,
            'label': asset.name,
            'type': asset.asset_type,
            'group': domain or 'other'
        })
        
        # Group by domain
        relationships['groups'][domain or 'other'].append(node_id)
    
    # Build relationships
    for asset in assets:
        source_id = str(asset.id)
        domain = extract_domain(asset.name, asset.asset_type)
        
        # Subdomain -> Domain relationship
        if asset.asset_type == 'subdomain' and domain:
            # Find parent domain asset
            for other_asset in assets:
                if (other_asset.asset_type == 'domain' and 
                    extract_domain(other_asset.name, other_asset.asset_type) == domain):
                    relationships['edges'].append({
                        'from': source_id,
                        'to': str(other_asset.id),
                        'type': 'subdomain_of',
                        'label': 'subdomain of'
                    })
                    break
        
        # IP -> Domain relationship (if IP resolves to domain)
        if asset.asset_type == 'ip':
            # Try to find related domain/subdomain assets
            # This would require metadata with resolved domains
            try:
                if hasattr(asset, 'metadata') and asset.metadata:
                    metadata = asset.metadata.metadata if hasattr(asset.metadata, 'metadata') else asset.metadata
                    if isinstance(metadata, dict) and 'resolved_domains' in metadata:
                        for domain_name in metadata.get('resolved_domains', []):
                            for other_asset in assets:
                                if (other_asset.asset_type in ['domain', 'subdomain'] and
                                    domain_name in other_asset.name):
                                    relationships['edges'].append({
                                        'from': source_id,
                                        'to': str(other_asset.id),
                                        'type': 'resolves_to',
                                        'label': 'resolves to'
                                    })
            except:
                pass
        
        # Port -> IP relationship
        if asset.asset_type == 'port':
            # Port assets typically have format "IP:PORT" or are linked via metadata
            try:
                if hasattr(asset, 'metadata') and asset.metadata:
                    metadata = asset.metadata.metadata if hasattr(asset.metadata, 'metadata') else asset.metadata
                    if isinstance(metadata, dict) and 'ip_address' in metadata:
                        ip_address = metadata['ip_address']
                        for other_asset in assets:
                            if other_asset.asset_type == 'ip' and other_asset.name == ip_address:
                                relationships['edges'].append({
                                    'from': source_id,
                                    'to': str(other_asset.id),
                                    'type': 'port_on',
                                    'label': 'port on'
                                })
                                break
            except:
                pass
    
    return relationships


def get_asset_network_graph(organization_id=None):
    """
    Get asset network graph for visualization.
    
    Args:
        organization_id: Optional organization ID to filter assets
    
    Returns:
        Dictionary with nodes and edges for network visualization
    """
    from .models import Asset
    
    queryset = Asset.objects.filter(is_active=True)
    if organization_id:
        queryset = queryset.filter(organization_id=organization_id)
    
    return build_asset_relationships(queryset)

