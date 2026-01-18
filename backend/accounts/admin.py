"""
Admin configuration for accounts app.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Organization, MFARecoveryCode


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ['name', 'status', 'mfa_required', 'created_at']
    list_filter = ['status', 'mfa_required']
    search_fields = ['name']


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'username', 'role', 'organization', 'mfa_enabled', 'is_active', 'last_login']
    list_filter = ['role', 'mfa_enabled', 'is_active', 'organization']
    search_fields = ['email', 'username']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('EASM Fields', {
            'fields': ('role', 'organization', 'mfa_enabled', 'mfa_secret')
        }),
    )


@admin.register(MFARecoveryCode)
class MFARecoveryCodeAdmin(admin.ModelAdmin):
    list_display = ['user', 'used', 'created_at', 'used_at']
    list_filter = ['used']
    search_fields = ['user__email']

