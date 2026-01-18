"""
Admin configuration for scans app.
"""
from django.contrib import admin
from .models import ScanRun


@admin.register(ScanRun)
class ScanRunAdmin(admin.ModelAdmin):
    list_display = ['scan_type', 'organization', 'status', 'started_at', 'finished_at']
    list_filter = ['scan_type', 'status']
    search_fields = ['organization__name']
    readonly_fields = ['id', 'created_at', 'updated_at']

