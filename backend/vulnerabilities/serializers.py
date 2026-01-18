"""
Serializers for vulnerabilities app.
"""
from rest_framework import serializers
from .models import Vulnerability


class VulnerabilitySerializer(serializers.ModelSerializer):
    """Vulnerability serializer."""
    
    asset_name = serializers.CharField(source='asset.name', read_only=True)
    asset_type = serializers.CharField(source='asset.asset_type', read_only=True)
    
    class Meta:
        model = Vulnerability
        fields = [
            'id', 'asset', 'asset_name', 'asset_type', 'title', 'category',
            'severity', 'cvss', 'evidence', 'detected_at', 'status',
            'description', 'remediation', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'detected_at', 'created_at', 'updated_at']

