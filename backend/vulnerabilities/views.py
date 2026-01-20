"""
Views for vulnerabilities app.
"""
from rest_framework import generics, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Vulnerability
from .serializers import VulnerabilitySerializer
from accounts.permissions import IsViewerOrAbove, IsUserOrAbove


class VulnerabilityListView(generics.ListAPIView):
    """List vulnerabilities with filtering."""
    serializer_class = VulnerabilitySerializer
    permission_classes = [IsViewerOrAbove]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['severity', 'status', 'category']
    search_fields = ['title', 'description']
    ordering_fields = ['detected_at', 'severity', 'cvss']
    ordering = ['-detected_at']
    
    def get_queryset(self):
        """Get vulnerabilities for user's organization."""
        user = self.request.user
        if user.role == 'super_admin':
            return Vulnerability.objects.all()
        return Vulnerability.objects.filter(asset__organization=user.organization)


class VulnerabilityDetailView(generics.RetrieveUpdateAPIView):
    """
    Vulnerability detail view.
    - Viewers: Read-only (can only retrieve)
    - Users and above: Can update
    """
    serializer_class = VulnerabilitySerializer
    permission_classes = [IsViewerOrAbove]
    
    def get_queryset(self):
        """Get vulnerabilities for user's organization."""
        user = self.request.user
        if user.role == 'super_admin':
            return Vulnerability.objects.all()
        return Vulnerability.objects.filter(asset__organization=user.organization)
    
    def update(self, request, *args, **kwargs):
        """Update vulnerability - viewers cannot update."""
        if request.user.role == 'viewer':
            from rest_framework.response import Response
            from rest_framework import status
            return Response(
                {'error': 'Viewers have read-only access. Cannot update vulnerabilities.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

