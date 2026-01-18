"""
Serializers for accounts app.
"""
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.tokens import RefreshToken
import pyotp
import qrcode
import io
import base64
from .models import User, Organization, MFARecoveryCode


class OrganizationSerializer(serializers.ModelSerializer):
    """Organization serializer."""
    
    class Meta:
        model = Organization
        fields = ['id', 'name', 'status', 'created_at', 'updated_at', 'mfa_required']
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserSerializer(serializers.ModelSerializer):
    """User serializer."""
    
    organization_name = serializers.SerializerMethodField()
    organization = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'role', 'organization', 'organization_name',
            'mfa_enabled', 'is_active', 'created_at', 'last_login'
        ]
        read_only_fields = ['id', 'created_at', 'last_login']
    
    def get_organization(self, obj):
        """Safely get organization ID."""
        return str(obj.organization.id) if obj.organization else None
    
    def get_organization_name(self, obj):
        """Safely get organization name."""
        return obj.organization.name if obj.organization else None


class LoginSerializer(serializers.Serializer):
    """Login serializer."""
    
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    code = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        code = attrs.get('code', '')
        
        if not email or not password:
            raise serializers.ValidationError('Email and password are required.')
        
        user = authenticate(username=email, password=password)
        if not user:
            raise serializers.ValidationError('Invalid credentials.')
        
        if not user.is_active:
            raise serializers.ValidationError('User account is disabled.')
        
        # Check MFA requirement
        if user.mfa_enabled:
            if not code:
                raise serializers.ValidationError({
                    'mfa_required': True,
                    'message': 'MFA code is required.'
                })
            
            # Verify TOTP
            if not user.mfa_secret:
                # MFA enabled but no secret - disable it
                user.mfa_enabled = False
                user.save()
            else:
                totp = pyotp.TOTP(user.mfa_secret)
                if not totp.verify(code, valid_window=1):
                    raise serializers.ValidationError({
                        'error': 'Invalid MFA code.'
                    })
        # Allow login even if MFA is required but not set up yet
        # User can set up MFA after first login
        
        attrs['user'] = user
        return attrs


class MFASetupSerializer(serializers.Serializer):
    """MFA setup serializer."""
    
    def get_qr_code(self, user):
        """Generate QR code for MFA setup."""
        if not user.mfa_secret:
            # Generate new secret
            secret = pyotp.random_base32()
            user.mfa_secret = secret
            user.save()
        else:
            secret = user.mfa_secret
        
        totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
            name=user.email,
            issuer_name='EASM Platform'
        )
        
        # Generate QR code
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(totp_uri)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        
        # Convert to base64
        img_str = base64.b64encode(buffer.getvalue()).decode()
        
        return {
            'secret': secret,
            'qr_code': f'data:image/png;base64,{img_str}',
            'recovery_codes': MFARecoveryCode.generate_codes()
        }


class MFAVerifySerializer(serializers.Serializer):
    """MFA verification serializer."""
    
    code = serializers.CharField(max_length=6, min_length=6)
    
    def validate_code(self, value):
        """Validate MFA code."""
        user = self.context['user']
        if not user.mfa_secret:
            raise serializers.ValidationError('MFA is not set up for this user.')
        
        totp = pyotp.TOTP(user.mfa_secret)
        if not totp.verify(value, valid_window=1):
            raise serializers.ValidationError('Invalid MFA code.')
        
        return value


class TokenSerializer(serializers.Serializer):
    """Token serializer."""
    
    access = serializers.CharField()
    refresh = serializers.CharField()
    user = UserSerializer()

