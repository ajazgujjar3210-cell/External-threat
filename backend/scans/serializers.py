"""
Serializers for scans app.
"""
from rest_framework import serializers
from .models import ScanRun, ScheduledDiscovery


class ScanRunSerializer(serializers.ModelSerializer):
    """Scan run serializer."""
    
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    duration = serializers.SerializerMethodField()
    
    class Meta:
        model = ScanRun
        fields = [
            'id', 'organization', 'organization_name', 'scan_type', 'status',
            'started_at', 'finished_at', 'duration', 'config', 'results',
            'error_message', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_duration(self, obj):
        """Calculate scan duration."""
        if obj.started_at and obj.finished_at:
            delta = obj.finished_at - obj.started_at
            return str(delta)
        return None


class ScheduledDiscoverySerializer(serializers.ModelSerializer):
    """Scheduled discovery serializer."""
    
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    created_by_email = serializers.CharField(source='created_by.email', read_only=True)
    
    class Meta:
        model = ScheduledDiscovery
        fields = [
            'id', 'organization', 'organization_name', 'created_by', 'created_by_email',
            'domain', 'frequency', 'enable_port_scan', 'enable_service_detection',
            'is_active', 'last_run', 'next_run', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'last_run', 'next_run']

