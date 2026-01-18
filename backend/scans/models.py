"""
Scan models for EASM Platform.
"""
import uuid
from django.db import models
from django.utils import timezone
from datetime import timedelta
from accounts.models import Organization, User


class ScanRun(models.Model):
    """Scan run model."""
    
    SCAN_TYPE_CHOICES = [
        ('discovery', 'Asset Discovery'),
        ('port', 'Port Scan'),
        ('vulnerability', 'Vulnerability Scan'),
        ('ssl', 'SSL Check'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('stopped', 'Stopped'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='scan_runs')
    scan_type = models.CharField(max_length=50, choices=SCAN_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    config = models.JSONField(default=dict, help_text='Scan configuration')
    results = models.JSONField(default=dict, help_text='Scan results')
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'scan_runs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['organization', 'scan_type']),
            models.Index(fields=['organization', 'status']),
        ]
    
    def __str__(self):
        return f"{self.scan_type} - {self.organization.name} - {self.status}"


class ScheduledDiscovery(models.Model):
    """Scheduled discovery scan model for continuous asset discovery."""
    
    FREQUENCY_CHOICES = [
        ('hourly', 'Hourly'),
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='scheduled_discoveries')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_discoveries')
    domain = models.CharField(max_length=255, help_text='Domain to discover assets for')
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='daily')
    enable_port_scan = models.BooleanField(default=False, help_text='Enable port scanning')
    enable_service_detection = models.BooleanField(default=False, help_text='Enable service detection')
    is_active = models.BooleanField(default=True, help_text='Whether the scheduled discovery is active')
    last_run = models.DateTimeField(null=True, blank=True, help_text='Last time the discovery was run')
    next_run = models.DateTimeField(null=True, blank=True, help_text='Next scheduled run time')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'scheduled_discoveries'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['organization', 'is_active']),
            models.Index(fields=['next_run']),
        ]
        verbose_name = 'Scheduled Discovery'
        verbose_name_plural = 'Scheduled Discoveries'
    
    def __str__(self):
        return f"{self.domain} - {self.get_frequency_display()} - {self.organization.name}"
    
    def calculate_next_run(self):
        """Calculate next run time based on frequency."""
        now = timezone.now()
        if self.frequency == 'hourly':
            next_run = now + timedelta(hours=1)
        elif self.frequency == 'daily':
            next_run = now + timedelta(days=1)
        elif self.frequency == 'weekly':
            next_run = now + timedelta(weeks=1)
        elif self.frequency == 'monthly':
            next_run = now + timedelta(days=30)
        else:
            next_run = now + timedelta(days=1)
        return next_run
    
    def save(self, *args, **kwargs):
        """Override save to calculate next_run if not set."""
        if not self.next_run and self.is_active:
            self.next_run = self.calculate_next_run()
        super().save(*args, **kwargs)

