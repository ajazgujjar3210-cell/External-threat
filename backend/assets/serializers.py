"""
Serializers for assets app.
"""
from rest_framework import serializers
from .models import Asset, AssetChange, Ownership, AssetMetadata, AssetCategory, OwnershipHistory, AlertConfiguration, AlertRule


class AssetCategorySerializer(serializers.ModelSerializer):
    """Asset category serializer."""
    
    asset_count = serializers.IntegerField(source='assets.count', read_only=True)
    
    class Meta:
        model = AssetCategory
        fields = ['id', 'name', 'description', 'asset_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class AssetSerializer(serializers.ModelSerializer):
    """Asset serializer."""
    
    ownership = serializers.SerializerMethodField()
    metadata = serializers.SerializerMethodField()
    change_count = serializers.IntegerField(source='changes.count', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    domain = serializers.SerializerMethodField()
    
    class Meta:
        model = Asset
        fields = [
            'id', 'name', 'asset_type', 'first_seen', 'last_seen',
            'is_active', 'is_unknown', 'discovery_source', 'category', 'category_name',
            'sensitivity', 'function', 'criticality', 'created_at', 'updated_at',
            'ownership', 'metadata', 'change_count', 'domain'
        ]
        read_only_fields = ['id', 'first_seen', 'created_at', 'updated_at', 'discovery_source', 'is_unknown']
    
    def validate_name(self, value):
        """Validate asset name."""
        if not value or not value.strip():
            raise serializers.ValidationError('Asset name is required')
        return value.strip()
    
    def validate_asset_type(self, value):
        """Validate asset type."""
        valid_types = ['domain', 'subdomain', 'ip', 'api', 'web_service', 'web_application', 'port', 'service']
        if value not in valid_types:
            raise serializers.ValidationError(f'Asset type must be one of: {", ".join(valid_types)}')
        return value
    
    def get_ownership(self, obj):
        """Get ownership data."""
        try:
            ownership = obj.ownership
            return {
                'department': ownership.department,
                'owner_name': ownership.owner_name,
                'owner_email': ownership.owner_email,
            }
        except Ownership.DoesNotExist:
            return None
    
    def get_metadata(self, obj):
        """Get metadata."""
        try:
            metadata_obj = obj.metadata
            # Return the metadata JSONField directly, or provide defaults
            return metadata_obj.metadata if metadata_obj.metadata else {}
        except AssetMetadata.DoesNotExist:
            return None
    
    def get_domain(self, obj):
        """Get extracted domain for grouping."""
        from .domain_utils import extract_domain
        return extract_domain(obj.name, obj.asset_type)


class AssetChangeSerializer(serializers.ModelSerializer):
    """Asset change serializer."""
    
    asset_name = serializers.CharField(source='asset.name', read_only=True)
    asset_type = serializers.CharField(source='asset.asset_type', read_only=True)
    
    class Meta:
        model = AssetChange
        fields = ['id', 'asset', 'asset_name', 'asset_type', 'change_type', 'timestamp', 'details']
        read_only_fields = ['id', 'timestamp']


class OwnershipSerializer(serializers.ModelSerializer):
    """Ownership serializer."""
    
    asset_name = serializers.CharField(source='asset.name', read_only=True)
    
    class Meta:
        model = Ownership
        fields = ['id', 'asset', 'asset_name', 'department', 'owner_name', 'owner_email', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class AssetMetadataSerializer(serializers.ModelSerializer):
    """Asset metadata serializer."""
    
    asset_name = serializers.CharField(source='asset.name', read_only=True)
    
    class Meta:
        model = AssetMetadata
        fields = [
            'id', 'asset', 'asset_name', 'metadata', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class OwnershipHistorySerializer(serializers.ModelSerializer):
    """Ownership history serializer."""
    
    asset_name = serializers.CharField(source='asset.name', read_only=True)
    changed_by_email = serializers.CharField(source='changed_by.email', read_only=True, allow_null=True)
    changed_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = OwnershipHistory
        fields = [
            'id', 'asset', 'asset_name', 'changed_by', 'changed_by_email', 'changed_by_name',
            'old_department', 'new_department', 'old_owner_name', 'new_owner_name',
            'old_owner_email', 'new_owner_email', 'change_reason', 'changed_at'
        ]
        read_only_fields = ['id', 'changed_at']
    
    def get_changed_by_name(self, obj):
        """Get changed by user's full name or username."""
        if obj.changed_by:
            if obj.changed_by.first_name or obj.changed_by.last_name:
                return f"{obj.changed_by.first_name} {obj.changed_by.last_name}".strip()
            return obj.changed_by.username or obj.changed_by.email
        return None


class AlertConfigurationSerializer(serializers.ModelSerializer):
    """Alert configuration serializer."""
    
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    
    class Meta:
        model = AlertConfiguration
        fields = [
            'id', 'organization', 'organization_name', 'enabled', 'email_enabled',
            'email_recipients', 'notify_on_low', 'notify_on_medium', 'notify_on_high',
            'notify_on_critical', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AlertRuleSerializer(serializers.ModelSerializer):
    """Alert rule serializer."""
    
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    
    class Meta:
        model = AlertRule
        fields = [
            'id', 'organization', 'organization_name', 'name', 'description',
            'rule_type', 'operator', 'threshold_value', 'enabled', 'severity',
            'conditions', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
