"""
Serializers for audit app.
"""
from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    """Audit log serializer."""
    
    user_email = serializers.CharField(source='user.email', read_only=True)
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_email', 'organization', 'organization_name',
            'action', 'resource_type', 'resource_id', 'details',
            'ip_address', 'user_agent', 'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']

