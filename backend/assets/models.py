"""
Asset models for EASM Platform.
"""
import uuid
from django.db import models
from django.utils import timezone
from accounts.models import Organization


class AssetCategory(models.Model):
    """Asset category model for classification."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='asset_categories')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'asset_categories'
        ordering = ['name']
        unique_together = [['organization', 'name']]
    
    def __str__(self):
        return self.name


class Asset(models.Model):
    """Asset model for discovered assets."""
    
    ASSET_TYPE_CHOICES = [
        ('domain', 'Domain'),
        ('subdomain', 'Subdomain'),
        ('ip', 'IP Address'),
        ('api', 'API Endpoint'),
        ('web_service', 'Web Service'),
        ('web_application', 'Web Application'),
        ('port', 'Exposed Port'),
        ('service', 'Service'),
    ]
    
    SENSITIVITY_CHOICES = [
        ('public', 'Public'),
        ('internal', 'Internal'),
        ('confidential', 'Confidential'),
        ('restricted', 'Restricted'),
    ]
    
    FUNCTION_CHOICES = [
        ('customer_facing', 'Customer-Facing'),
        ('internal', 'Internal'),
        ('partner', 'Partner'),
        ('development', 'Development'),
    ]
    
    CRITICALITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='assets')
    name = models.CharField(max_length=255, db_index=True)
    asset_type = models.CharField(max_length=20, choices=ASSET_TYPE_CHOICES, db_index=True)
    first_seen = models.DateTimeField(auto_now_add=True)
    last_seen = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True, db_index=True)
    discovery_source = models.CharField(max_length=100, help_text='Source of discovery (amass, subfinder, crt.sh, etc.)')
    is_unknown = models.BooleanField(default=False, db_index=True, help_text='Flag for unknown/unmanaged assets')
    category = models.ForeignKey('AssetCategory', on_delete=models.SET_NULL, null=True, blank=True, related_name='assets')
    sensitivity = models.CharField(max_length=20, choices=SENSITIVITY_CHOICES, default='public')
    function = models.CharField(max_length=20, choices=FUNCTION_CHOICES, blank=True)
    criticality = models.CharField(max_length=20, choices=CRITICALITY_CHOICES, default='low', db_index=True, help_text='Asset criticality level')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'assets'
        ordering = ['-last_seen']
        indexes = [
            models.Index(fields=['organization', 'asset_type']),
            models.Index(fields=['organization', 'is_active']),
            models.Index(fields=['organization', 'is_unknown']),
            models.Index(fields=['organization', 'criticality']),
            models.Index(fields=['name']),
        ]
        unique_together = [['organization', 'name', 'asset_type']]
    
    def __str__(self):
        return f"{self.name} ({self.asset_type})"


class AssetChange(models.Model):
    """Asset change tracking model."""
    
    CHANGE_TYPE_CHOICES = [
        ('new', 'New Asset'),
        ('removed', 'Asset Removed'),
        ('status_change', 'Status Changed'),
        ('service_exposed', 'New Service Exposed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='changes')
    change_type = models.CharField(max_length=20, choices=CHANGE_TYPE_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True)
    scan_run = models.ForeignKey('scans.ScanRun', on_delete=models.SET_NULL, null=True, blank=True, related_name='asset_changes')
    details = models.JSONField(default=dict, help_text='Additional change details')
    
    class Meta:
        db_table = 'asset_changes'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['asset', 'timestamp']),
            models.Index(fields=['change_type', 'timestamp']),
        ]
    
    def __str__(self):
        return f"{self.asset.name} - {self.change_type}"


class Ownership(models.Model):
    """Asset ownership model."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    asset = models.OneToOneField(Asset, on_delete=models.CASCADE, related_name='ownership')
    department = models.CharField(max_length=255, blank=True)
    owner_name = models.CharField(max_length=255, blank=True)
    owner_email = models.EmailField(blank=True)
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'ownership'
    
    def __str__(self):
        return f"Ownership for {self.asset.name}"


class OwnershipHistory(models.Model):
    """Track ownership changes for audit trail."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='ownership_history')
    changed_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='ownership_changes')
    old_department = models.CharField(max_length=255, blank=True)
    new_department = models.CharField(max_length=255, blank=True)
    old_owner_name = models.CharField(max_length=255, blank=True)
    new_owner_name = models.CharField(max_length=255, blank=True)
    old_owner_email = models.EmailField(blank=True)
    new_owner_email = models.EmailField(blank=True)
    change_reason = models.TextField(blank=True, help_text='Reason for ownership change')
    changed_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'ownership_history'
        ordering = ['-changed_at']
        indexes = [
            models.Index(fields=['asset', 'changed_at']),
        ]
    
    def __str__(self):
        return f"Ownership change for {self.asset.name} at {self.changed_at}"


class AssetMetadata(models.Model):
    """Asset metadata model."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    asset = models.OneToOneField(Asset, on_delete=models.CASCADE, related_name='metadata')
    metadata = models.JSONField(default=dict, help_text='Additional asset metadata')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'asset_metadata'
    
    def __str__(self):
        return f"Metadata for {self.asset.name}"


class AlertConfiguration(models.Model):
    """Organization-level alert configuration."""
    
    SEVERITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.OneToOneField(Organization, on_delete=models.CASCADE, related_name='alert_config')
    enabled = models.BooleanField(default=True, help_text='Enable/disable all alerts for this organization')
    
    # Email notification settings
    email_enabled = models.BooleanField(default=True, help_text='Enable email notifications')
    email_recipients = models.JSONField(default=list, help_text='List of email addresses to receive alerts')
    
    # Severity-based notification settings
    notify_on_low = models.BooleanField(default=False, help_text='Send notifications for low severity events')
    notify_on_medium = models.BooleanField(default=True, help_text='Send notifications for medium severity events')
    notify_on_high = models.BooleanField(default=True, help_text='Send notifications for high severity events')
    notify_on_critical = models.BooleanField(default=True, help_text='Send notifications for critical severity events')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'alert_configurations'
        verbose_name = 'Alert Configuration'
        verbose_name_plural = 'Alert Configurations'
    
    def __str__(self):
        return f"Alert Config for {self.organization.name}"


class AlertRule(models.Model):
    """Configurable alert rules for specific conditions."""
    
    RULE_TYPE_CHOICES = [
        ('asset_count_threshold', 'Asset Count Threshold'),
        ('new_assets_threshold', 'New Assets Threshold'),
        ('unknown_assets_threshold', 'Unknown Assets Threshold'),
        ('vulnerability_count_threshold', 'Vulnerability Count Threshold'),
        ('risk_score_threshold', 'Risk Score Threshold'),
    ]
    
    OPERATOR_CHOICES = [
        ('greater_than', 'Greater Than'),
        ('less_than', 'Less Than'),
        ('equals', 'Equals'),
        ('greater_than_or_equal', 'Greater Than Or Equal'),
        ('less_than_or_equal', 'Less Than Or Equal'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='alert_rules')
    name = models.CharField(max_length=255, help_text='Rule name')
    description = models.TextField(blank=True, help_text='Rule description')
    rule_type = models.CharField(max_length=50, choices=RULE_TYPE_CHOICES)
    operator = models.CharField(max_length=30, choices=OPERATOR_CHOICES)
    threshold_value = models.FloatField(help_text='Threshold value to compare against')
    enabled = models.BooleanField(default=True, help_text='Enable/disable this rule')
    severity = models.CharField(max_length=20, choices=AlertConfiguration.SEVERITY_CHOICES, default='medium')
    
    # Additional conditions
    conditions = models.JSONField(default=dict, help_text='Additional rule conditions (e.g., asset_type, time_window)')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'alert_rules'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['organization', 'enabled']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.organization.name})"
