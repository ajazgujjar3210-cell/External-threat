"""
Serializers for assets app.
"""
from rest_framework import serializers
from .models import Asset, AssetChange, Ownership, AssetMetadata, AssetCategory


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
    
    class Meta:
        model = Asset
        fields = [
            'id', 'name', 'asset_type', 'first_seen', 'last_seen',
            'is_active', 'is_unknown', 'discovery_source', 'category', 'category_name',
            'sensitivity', 'function', 'created_at', 'updated_at',
            'ownership', 'metadata', 'change_count'
        ]
        read_only_fields = ['id', 'first_seen', 'created_at', 'updated_at', 'discovery_source', 'is_unknown']
    
    def validate_name(self, value):
        """Validate asset name."""
        if not value or not value.strip():
            raise serializers.ValidationError('Asset name is required')
        return value.strip()
    
    def validate_asset_type(self, value):
        """Validate asset type."""
        valid_types = ['domain', 'subdomain', 'ip', 'api']
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
            metadata = obj.metadata
            return {
                'criticality': metadata.criticality,
                'business_function': metadata.business_function,
                'tags': metadata.tags,
            }
        except AssetMetadata.DoesNotExist:
            return None


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
            'id', 'asset', 'asset_name', 'criticality', 'business_function',
            'tags', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
