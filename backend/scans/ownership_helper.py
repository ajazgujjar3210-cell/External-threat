"""
Helper function for automatic ownership assignment.
"""
from assets.models import Ownership
import logging

logger = logging.getLogger(__name__)


def auto_assign_ownership(asset, asset_data):
    """
    Automatically assign ownership to discovered assets based on patterns.
    """
    try:
        # Check if ownership already exists
        if hasattr(asset, 'ownership'):
            return  # Ownership already exists
        
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
        
        ownership.save()
        
        logger.info(f"Auto-assigned ownership for {asset.name}: {ownership.department} - {ownership.owner_name}")
        
    except Exception as e:
        logger.warning(f"Failed to auto-assign ownership for {asset.name}: {str(e)}")
        pass

