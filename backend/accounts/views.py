"""
Views for accounts app.
"""
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils import timezone
from .models import User, Organization, MFARecoveryCode
from .serializers import (
    UserSerializer, LoginSerializer, MFASetupSerializer,
    MFAVerifySerializer, TokenSerializer, OrganizationSerializer
)
from .permissions import IsSuperAdmin, IsOrgAdmin, IsOrgMember


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login(request):
    """Login endpoint."""
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    user = serializer.validated_data['user']
    
    # Update last login
    user.last_login = timezone.now()
    user.save()
    
    # Generate tokens
    refresh = RefreshToken.for_user(user)
    
    # Serialize user
    user_serializer = UserSerializer(user)
    
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': user_serializer.data
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def refresh_token(request):
    """Refresh token endpoint."""
    refresh_token = request.data.get('refresh')
    if not refresh_token:
        return Response(
            {'error': 'Refresh token is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        refresh = RefreshToken(refresh_token)
        access = refresh.access_token
        return Response({
            'access': str(access)
        })
    except Exception as e:
        return Response(
            {'error': 'Invalid refresh token.'},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def me(request):
    """Get current user."""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def mfa_setup(request):
    """MFA setup endpoint."""
    if request.method == 'GET':
        serializer = MFASetupSerializer()
        data = serializer.get_qr_code(request.user)
        return Response(data)
    
    # POST - Enable MFA
    serializer = MFAVerifySerializer(data=request.data, context={'user': request.user})
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # Enable MFA
    request.user.mfa_enabled = True
    request.user.save()
    
    # Generate recovery codes
    codes = MFARecoveryCode.generate_codes()
    for code in codes:
        MFARecoveryCode.objects.create(
            user=request.user,
            code_hash=MFARecoveryCode.hash_code(code)
        )
    
    return Response({
        'message': 'MFA enabled successfully.',
        'recovery_codes': codes  # Show only once
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mfa_disable(request):
    """Disable MFA endpoint."""
    serializer = MFAVerifySerializer(data=request.data, context={'user': request.user})
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # Disable MFA
    request.user.mfa_enabled = False
    request.user.mfa_secret = None
    request.user.save()
    
    # Delete recovery codes
    MFARecoveryCode.objects.filter(user=request.user).delete()
    
    return Response({'message': 'MFA disabled successfully.'})


# Organization Management (Super Admin only)
class OrganizationListCreateView(generics.ListCreateAPIView):
    """List and create organizations (Super Admin only)."""
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [IsSuperAdmin]
    
    def perform_create(self, serializer):
        serializer.save()


class OrganizationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Organization detail view (Super Admin only)."""
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [IsSuperAdmin]


# User Management (Org Admin only)
class UserListCreateView(generics.ListCreateAPIView):
    """List and create users (Org Admin only)."""
    serializer_class = UserSerializer
    permission_classes = [IsOrgAdmin]
    
    def get_queryset(self):
        """Get users in the same organization."""
        return User.objects.filter(organization=self.request.user.organization)
    
    def perform_create(self, serializer):
        """Create user in the same organization."""
        serializer.save(organization=self.request.user.organization)


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """User detail view (Org Admin only)."""
    serializer_class = UserSerializer
    permission_classes = [IsOrgAdmin]
    
    def get_queryset(self):
        """Get users in the same organization."""
        return User.objects.filter(organization=self.request.user.organization)

