"""
Views for risk engine app.
"""
from rest_framework import generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import RiskScore
from .serializers import RiskScoreSerializer
from accounts.permissions import IsViewerOrAbove


class RiskScoreListView(generics.ListAPIView):
    """List risk scores."""
    serializer_class = RiskScoreSerializer
    permission_classes = [IsViewerOrAbove]
    ordering = ['-score']
    
    def get_queryset(self):
        """Get risk scores for user's organization."""
        user = self.request.user
        if user.role == 'super_admin':
            return RiskScore.objects.all()
        return RiskScore.objects.filter(vulnerability__asset__organization=user.organization)


class RiskScoreDetailView(generics.RetrieveAPIView):
    """Risk score detail view."""
    serializer_class = RiskScoreSerializer
    permission_classes = [IsViewerOrAbove]
    
    def get_queryset(self):
        """Get risk scores for user's organization."""
        user = self.request.user
        if user.role == 'super_admin':
            return RiskScore.objects.all()
        return RiskScore.objects.filter(vulnerability__asset__organization=user.organization)


@api_view(['GET'])
@permission_classes([IsViewerOrAbove])
def top_risks(request):
    """Get top risks."""
    limit = int(request.query_params.get('limit', 10))
    user = request.user
    
    queryset = RiskScore.objects.all()
    if user.role != 'super_admin':
        queryset = queryset.filter(vulnerability__asset__organization=user.organization)
    
    top_risks = queryset.order_by('-score')[:limit]
    serializer = RiskScoreSerializer(top_risks, many=True)
    return Response(serializer.data)

