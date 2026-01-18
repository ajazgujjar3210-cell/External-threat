"""
Admin configuration for vulnerabilities app.
"""
from django.contrib import admin
from .models import Vulnerability


@admin.register(Vulnerability)
class VulnerabilityAdmin(admin.ModelAdmin):
    list_display = ['title', 'asset', 'severity', 'status', 'detected_at']
    list_filter = ['severity', 'status', 'category']
    search_fields = ['title', 'description', 'asset__name']
    readonly_fields = ['id', 'detected_at', 'created_at', 'updated_at']

