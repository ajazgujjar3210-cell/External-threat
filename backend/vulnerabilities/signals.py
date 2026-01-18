"""
Signals for vulnerabilities app.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Vulnerability
from scans.alerts import alert_new_critical_vulnerability
from risk_engine.calculator import calculate_and_save_risk_score


@receiver(post_save, sender=Vulnerability)
def on_vulnerability_created(sender, instance, created, **kwargs):
    """
    Handle new vulnerability creation.
    """
    if created:
        # Calculate risk score
        try:
            calculate_and_save_risk_score(instance)
        except Exception:
            pass
        
        # Send alert for critical vulnerabilities
        if instance.severity in ['critical', 'high']:
            try:
                alert_new_critical_vulnerability(instance)
            except Exception:
                pass

