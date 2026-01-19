"""
Admin configuration for assets app.
"""
from django.contrib import admin
from .models import Asset, AssetChange, Ownership, AssetMetadata


@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = ['name', 'asset_type', 'organization', 'is_active', 'first_seen', 'last_seen']
    list_filter = ['asset_type', 'is_active', 'discovery_source']
    search_fields = ['name']
    readonly_fields = ['id', 'first_seen', 'created_at', 'updated_at']


@admin.register(AssetChange)
class AssetChangeAdmin(admin.ModelAdmin):
    list_display = ['asset', 'change_type', 'timestamp']
    list_filter = ['change_type', 'timestamp']
    readonly_fields = ['id', 'timestamp']


@admin.register(Ownership)
class OwnershipAdmin(admin.ModelAdmin):
    list_display = ['asset', 'owner_name', 'department']
    search_fields = ['owner_name', 'owner_email', 'asset__name']


@admin.register(AssetMetadata)
class AssetMetadataAdmin(admin.ModelAdmin):
    list_display = ['asset', 'get_criticality', 'created_at', 'updated_at']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['asset__name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    def get_criticality(self, obj):
        """Get criticality from metadata JSONField."""
        if obj.metadata and 'criticality' in obj.metadata:
            return obj.metadata['criticality']
        return 'Not Set'
    get_criticality.short_description = 'Criticality'

