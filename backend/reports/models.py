"""
Report models for scheduled reports.
"""
import uuid
from django.db import models
from django.utils import timezone
from accounts.models import Organization, User


class ScheduledReport(models.Model):
    """Scheduled report model."""
    
    REPORT_TYPE_CHOICES = [
        ('inventory', 'Asset Inventory'),
        ('risk', 'Risk Summary'),
        ('vulnerabilities', 'Vulnerabilities'),
        ('iso27001', 'ISO 27001'),
        ('pci_dss', 'PCI DSS'),
        ('sbp', 'SBP Compliance'),
    ]
    
    FORMAT_CHOICES = [
        ('csv', 'CSV'),
        ('excel', 'Excel'),
        ('pdf', 'PDF'),
    ]
    
    FREQUENCY_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='scheduled_reports')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_reports')
    report_type = models.CharField(max_length=50, choices=REPORT_TYPE_CHOICES)
    format_type = models.CharField(max_length=20, choices=FORMAT_CHOICES, default='csv')
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES)
    recipients = models.JSONField(default=list, help_text='List of email addresses')
    is_active = models.BooleanField(default=True)
    last_run = models.DateTimeField(null=True, blank=True)
    next_run = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'scheduled_reports'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_report_type_display()} - {self.organization.name} - {self.frequency}"

