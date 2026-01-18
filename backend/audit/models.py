"""
Audit log models for EASM Platform.
"""
import uuid
from django.db import models
from django.utils import timezone
from accounts.models import User, Organization


class AuditLog(models.Model):
    """Audit log model."""
    
    ACTION_CHOICES = [
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('mfa_enable', 'MFA Enabled'),
        ('mfa_disable', 'MFA Disabled'),
        ('role_change', 'Role Changed'),
        ('user_create', 'User Created'),
        ('user_update', 'User Updated'),
        ('org_create', 'Organization Created'),
        ('org_update', 'Organization Updated'),
        ('asset_update', 'Asset Updated'),
        ('vulnerability_update', 'Vulnerability Updated'),
        ('risk_recalculate', 'Risk Recalculated'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='audit_logs')
    organization = models.ForeignKey(Organization, on_delete=models.SET_NULL, null=True, related_name='audit_logs')
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    resource_type = models.CharField(max_length=100, blank=True)
    resource_id = models.UUIDField(null=True, blank=True)
    details = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'audit_logs'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['organization', 'timestamp']),
            models.Index(fields=['action', 'timestamp']),
        ]
    
    def __str__(self):
        return f"{self.action} - {self.user} - {self.timestamp}"

