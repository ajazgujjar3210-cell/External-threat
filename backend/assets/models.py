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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'assets'
        ordering = ['-last_seen']
        indexes = [
            models.Index(fields=['organization', 'asset_type']),
            models.Index(fields=['organization', 'is_active']),
            models.Index(fields=['organization', 'is_unknown']),
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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'ownership'
    
    def __str__(self):
        return f"Ownership for {self.asset.name}"


class AssetMetadata(models.Model):
    """Asset metadata model."""
    
    CRITICALITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    asset = models.OneToOneField(Asset, on_delete=models.CASCADE, related_name='metadata')
    criticality = models.CharField(max_length=20, choices=CRITICALITY_CHOICES, default='low')
    business_function = models.CharField(max_length=255, blank=True)
    tags = models.JSONField(default=list, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'asset_metadata'
    
    def __str__(self):
        return f"Metadata for {self.asset.name}"
