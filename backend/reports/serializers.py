"""
Serializers for reports app.
"""
from rest_framework import serializers
from .models import ScheduledReport


class ScheduledReportSerializer(serializers.ModelSerializer):
    """Scheduled report serializer."""
    
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    created_by_email = serializers.CharField(source='created_by.email', read_only=True)
    
    class Meta:
        model = ScheduledReport
        fields = [
            'id', 'organization', 'organization_name', 'created_by', 'created_by_email',
            'report_type', 'format_type', 'frequency', 'recipients',
            'is_active', 'last_run', 'next_run', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'last_run', 'next_run']

