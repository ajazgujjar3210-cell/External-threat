"""
Risk engine models for EASM Platform.
"""
import uuid
from django.db import models
from django.utils import timezone
from vulnerabilities.models import Vulnerability
from celery import shared_task


class RiskScore(models.Model):
    """Risk score model with explainable scoring."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vulnerability = models.OneToOneField(Vulnerability, on_delete=models.CASCADE, related_name='risk_score')
    score = models.DecimalField(max_digits=5, decimal_places=2, db_index=True)
    explanation = models.JSONField(default=dict, help_text='Explainable risk calculation breakdown')
    calculated_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'risk_scores'
        ordering = ['-score']
        indexes = [
            models.Index(fields=['score']),
        ]
    
    def __str__(self):
        return f"Risk Score: {self.score} - {self.vulnerability.title}"

