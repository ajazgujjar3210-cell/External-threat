"""
Views for audit app.
"""
from rest_framework import generics
from .models import AuditLog
from .serializers import AuditLogSerializer
from accounts.permissions import IsViewerOrAbove


class AuditLogListView(generics.ListAPIView):
    """List audit logs."""
    serializer_class = AuditLogSerializer
    permission_classes = [IsViewerOrAbove]
    ordering = ['-timestamp']
    
    def get_queryset(self):
        """Get audit logs for user's organization."""
        user = self.request.user
        if user.role == 'super_admin':
            return AuditLog.objects.all()
        return AuditLog.objects.filter(organization=user.organization)

