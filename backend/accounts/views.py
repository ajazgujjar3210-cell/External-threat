"""
Views for accounts app.
"""
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils import timezone
from .models import User, Organization, MFARecoveryCode, OrganizationInvitation
from .serializers import (
    UserSerializer, LoginSerializer, MFASetupSerializer,
    MFAVerifySerializer, TokenSerializer, OrganizationSerializer,
    OrganizationInvitationAcceptSerializer
)
from django.core.mail import send_mail
from django.conf import settings
from datetime import timedelta
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
        organization = serializer.save()
        
        # If admin details provided, create invitation
        admin_email = serializer.validated_data.get('admin_email')
        if admin_email:
            # Create invitation
            token = OrganizationInvitation.generate_token()
            expires_at = timezone.now() + timedelta(days=7)  # Valid for 7 days
            
            invitation = OrganizationInvitation.objects.create(
                organization=organization,
                email=admin_email,
                token=token,
                expires_at=expires_at
            )
            
            # Send invitation email
            self.send_invitation_email(invitation, organization)
    
    def send_invitation_email(self, invitation, organization):
        """Send invitation email to organization admin."""
        # Check if using console backend (for development)
        using_console_backend = settings.EMAIL_BACKEND == 'django.core.mail.backends.console.EmailBackend'
        
        # If not using console backend and email not configured, skip
        if not using_console_backend and not settings.EMAIL_HOST_USER:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning("Email not configured. Invitation email not sent.")
            return False
        
        try:
            # Build invitation URL
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
            invitation_url = f"{frontend_url}/invite/{invitation.token}"
            
            subject = f"Invitation to join {organization.name} on EASM Platform"
            
            message = f"""
Hello {organization.admin_first_name or 'there'},

You have been invited to join {organization.name} as an Organization Admin on the EASM Platform.

Please click the link below to set up your account:
{invitation_url}

This invitation will expire in 7 days.

If you did not expect this invitation, please ignore this email.

Best regards,
EASM Platform Team
"""
            
            html_message = f"""
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1e40af;">Welcome to EASM Platform</h2>
        <p>Hello {organization.admin_first_name or 'there'},</p>
        <p>You have been invited to join <strong>{organization.name}</strong> as an Organization Admin on the EASM Platform.</p>
        <p>Please click the button below to set up your account:</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{invitation_url}" style="background: linear-gradient(to right, #1e3a8a, #9333ea); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Accept Invitation & Set Up Account
            </a>
        </div>
        <p style="font-size: 12px; color: #666;">Or copy and paste this link: {invitation_url}</p>
        <p style="color: #dc2626; font-size: 14px;"><strong>This invitation will expire in 7 days.</strong></p>
        <p style="font-size: 12px; color: #666;">If you did not expect this invitation, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">Best regards,<br>EASM Platform Team</p>
    </div>
</body>
</html>
"""
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL or settings.EMAIL_HOST_USER or 'tufailijaz353@gmail.com',
                recipient_list=[invitation.email],  # Uses the email from the form (admin_email)
                html_message=html_message,
                fail_silently=False  # Set to False to see errors in console
            )
            
            # Log success
            import logging
            logger = logging.getLogger(__name__)
            logger.info(f"Invitation email sent to {invitation.email} for organization {organization.name}")
            
            return True
        except Exception as e:
            # Log error but don't fail the request
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to send invitation email: {str(e)}")
            return False


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


@api_view(['GET', 'POST'])
@permission_classes([permissions.AllowAny])
def accept_invitation(request):
    """Accept organization invitation and set up account."""
    if request.method == 'GET':
        # Get invitation details
        token = request.query_params.get('token')
        if not token:
            return Response(
                {'error': 'Token is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            invitation = OrganizationInvitation.objects.get(token=token)
        except OrganizationInvitation.DoesNotExist:
            return Response(
                {'error': 'Invalid invitation token.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if not invitation.is_valid():
            return Response(
                {'error': 'Invitation has expired or already been used.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response({
            'email': invitation.email,
            'organization_name': invitation.organization.name,
            'mfa_required': invitation.organization.mfa_required,
            'expires_at': invitation.expires_at
        })
    
    # POST - Accept invitation
    serializer = OrganizationInvitationAcceptSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    invitation = serializer.validated_data['invitation']
    password = serializer.validated_data['password']
    mfa_code = serializer.validated_data.get('mfa_code', '')
    
    # Check if user already exists
    try:
        user = User.objects.get(email=invitation.email)
        # User exists, update password and organization
        user.set_password(password)
        user.organization = invitation.organization
        user.role = 'org_admin'
        user.is_active = True
        user.save()
    except User.DoesNotExist:
        # Create new user
        username = invitation.email.split('@')[0]
        # Ensure username is unique
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
        
        user = User.objects.create_user(
            username=username,
            email=invitation.email,
            password=password,
            first_name=invitation.organization.admin_first_name or '',
            last_name=invitation.organization.admin_last_name or '',
            role='org_admin',
            organization=invitation.organization,
            is_active=True
        )
    
    # Mark invitation as used
    invitation.used = True
    invitation.used_at = timezone.now()
    invitation.save()
    
    # If MFA is required, set it up
    if invitation.organization.mfa_required or user.requires_mfa():
        # Generate MFA secret and QR code
        mfa_serializer = MFASetupSerializer()
        mfa_data = mfa_serializer.get_qr_code(user)
        
        # If MFA code provided, verify and enable
        if mfa_code:
            from .serializers import MFAVerifySerializer
            verify_serializer = MFAVerifySerializer(
                data={'code': mfa_code},
                context={'user': user}
            )
            if verify_serializer.is_valid():
                user.mfa_enabled = True
                user.save()
                
                # Generate recovery codes
                codes = MFARecoveryCode.generate_codes()
                for code in codes:
                    MFARecoveryCode.objects.create(
                        user=user,
                        code_hash=MFARecoveryCode.hash_code(code)
                    )
                
                # Generate tokens
                refresh = RefreshToken.for_user(user)
                return Response({
                    'message': 'Account created and MFA enabled successfully.',
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                    'user': UserSerializer(user).data,
                    'recovery_codes': codes
                })
            else:
                # MFA code invalid, return QR code for retry
                return Response({
                    'mfa_required': True,
                    'mfa_setup': mfa_data,
                    'error': 'Invalid MFA code. Please try again.'
                }, status=status.HTTP_400_BAD_REQUEST)
        else:
            # MFA required but code not provided, return setup data
            return Response({
                'mfa_required': True,
                'mfa_setup': mfa_data,
                'message': 'Please set up MFA to complete account creation.'
            })
    
    # No MFA required, just generate tokens
    refresh = RefreshToken.for_user(user)
    return Response({
        'message': 'Account created successfully.',
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': UserSerializer(user).data
    })

