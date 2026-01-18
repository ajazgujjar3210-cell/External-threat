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
    """
    if created:
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

