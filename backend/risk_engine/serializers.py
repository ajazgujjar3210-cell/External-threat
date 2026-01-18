"""
Serializers for risk engine app.
"""
from rest_framework import serializers
from .models import RiskScore


class RiskScoreSerializer(serializers.ModelSerializer):
    """Risk score serializer."""
    
    vulnerability_title = serializers.CharField(source='vulnerability.title', read_only=True)
    asset_name = serializers.CharField(source='vulnerability.asset.name', read_only=True)
    
    class Meta:
        model = RiskScore
        fields = [
            'id', 'vulnerability', 'vulnerability_title', 'asset_name',
            'score', 'explanation', 'calculated_at', 'updated_at'
        ]
        read_only_fields = ['id', 'calculated_at', 'updated_at']

