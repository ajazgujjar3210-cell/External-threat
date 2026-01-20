"""
Signals for assets app.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import AssetChange
from scans.alerts import alert_new_asset, alert_asset_removed


@receiver(post_save, sender=AssetChange)
def on_asset_change_created(sender, instance, created, **kwargs):
    """
    Handle asset change creation.
    Skip sending individual emails for assets discovered during a discovery scan.
    Only send the summary email at the end of the scan.
    """
    if created:
        # Skip individual asset emails if this change is part of a discovery scan
        # The discovery completion email will be sent at the end with all details
        if instance.scan_run and instance.scan_run.scan_type == 'discovery':
            # Don't send individual emails during discovery scans
            # The summary email will be sent when the scan completes
            return
        
        if instance.change_type == 'new':
            try:
                alert_new_asset(instance)
            except Exception:
                pass
        elif instance.change_type == 'removed':
            try:
                alert_asset_removed(instance)
            except Exception:
                pass

