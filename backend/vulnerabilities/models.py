"""
Vulnerability models for EASM Platform.
"""
import uuid
from django.db import models
from django.utils import timezone
from assets.models import Asset


class Vulnerability(models.Model):
    """Vulnerability model."""
    
    SEVERITY_CHOICES = [
        ('critical', 'Critical'),
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
        ('info', 'Informational'),
    ]
    
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('false_positive', 'False Positive'),
        ('risk_accepted', 'Risk Accepted'),
    ]
    
    CATEGORY_CHOICES = [
        ('ssl', 'SSL/TLS'),
        ('port', 'Open Port'),
        ('service', 'Service Vulnerability'),
        ('web', 'Web Application'),
        ('api', 'API Vulnerability'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='vulnerabilities')
    title = models.CharField(max_length=500)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, db_index=True)
    cvss = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)
    evidence = models.JSONField(default=dict, help_text='Raw evidence from scanner')
    detected_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open', db_index=True)
    description = models.TextField(blank=True)
    remediation = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'vulnerabilities'
        ordering = ['-detected_at']
        indexes = [
            models.Index(fields=['asset', 'severity']),
            models.Index(fields=['asset', 'status']),
            models.Index(fields=['severity', 'status']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.asset.name}"

