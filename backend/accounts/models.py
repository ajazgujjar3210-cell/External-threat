"""
User and Organization models for EASM Platform.
"""
import uuid
import hashlib
import secrets
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class Organization(models.Model):
    """Organization model for multi-tenant support."""
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('suspended', 'Suspended'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    mfa_required = models.BooleanField(
        default=False,
        help_text='Enforce MFA for all users in this org'
    )
    
    class Meta:
        db_table = 'organizations'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name


class User(AbstractUser):
    """Custom user model with role-based access control."""
    
    ROLE_CHOICES = [
        ('super_admin', 'Super Admin'),
        ('org_admin', 'Organization Admin'),
        ('user', 'User'),
        ('security_analyst', 'Security Analyst'),
        ('viewer', 'Viewer'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='users',
        null=True,
        blank=True,
        help_text='NULL only for super_admin'
    )
    mfa_enabled = models.BooleanField(default=False)
    mfa_secret = models.TextField(
        blank=True,
        null=True,
        help_text='Encrypted TOTP secret'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login = models.DateTimeField(null=True, blank=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    class Meta:
        db_table = 'users'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['organization', 'role']),
        ]
    
    def __str__(self):
        return self.email
    
    def requires_mfa(self):
        """Check if user requires MFA based on role and org settings."""
        if self.role == 'super_admin' or self.role == 'org_admin':
            return True
        if self.organization and self.organization.mfa_required:
            return True
        return False


class MFARecoveryCode(models.Model):
    """MFA recovery codes for users."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='recovery_codes')
    code_hash = models.CharField(max_length=255)
    used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    used_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'mfa_recovery_codes'
        ordering = ['-created_at']
    
    @staticmethod
    def hash_code(code):
        """Hash a recovery code."""
        return hashlib.sha256(code.encode()).hexdigest()
    
    @staticmethod
    def generate_codes(count=10):
        """Generate recovery codes."""
        return [secrets.token_urlsafe(16) for _ in range(count)]
    
    def verify(self, code):
        """Verify a recovery code."""
        if self.used:
            return False
        return self.code_hash == self.hash_code(code)
    
    def mark_used(self):
        """Mark code as used."""
        self.used = True
        self.used_at = timezone.now()
        self.save()

