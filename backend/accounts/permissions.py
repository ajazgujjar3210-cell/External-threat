"""
Custom permissions for accounts app.
"""
from rest_framework import permissions


class IsSuperAdmin(permissions.BasePermission):
    """Permission for Super Admin only."""
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'super_admin'
        )


class IsOrgAdmin(permissions.BasePermission):
    """Permission for Organization Admin or Super Admin."""
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['org_admin', 'super_admin']
        )


class IsOrgMember(permissions.BasePermission):
    """Permission for any organization member."""
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.organization is not None
        )


class IsViewerOrAbove(permissions.BasePermission):
    """Permission for viewer role or above."""
    
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        # Super admin can access everything
        if request.user.role == 'super_admin':
            return True
        
        # Must be in an organization
        if not request.user.organization:
            return False
        
        # Any role in organization can view
        return request.user.role in ['super_admin', 'org_admin', 'user', 'security_analyst', 'viewer']


class IsSecurityAnalystOrAbove(permissions.BasePermission):
    """Permission for security analyst and above roles."""
    
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.role in ['super_admin', 'org_admin', 'user', 'security_analyst']


class IsAdminOrAbove(permissions.BasePermission):
    """Permission for admin and above roles."""
    
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.role in ['super_admin', 'org_admin']


class IsUserOrAbove(permissions.BasePermission):
    """Permission for user role and above (excludes viewer)."""
    
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        # Super admin can do everything
        if request.user.role == 'super_admin':
            return True
        # Must be in an organization
        if not request.user.organization:
            return False
        # User role and above can perform actions (not viewer)
        return request.user.role in ['org_admin', 'user', 'security_analyst']


class IsViewerReadOnly(permissions.BasePermission):
    """Permission check: viewers can only read, not modify."""
    
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        # Viewers can only use GET, HEAD, OPTIONS (read-only)
        if request.user.role == 'viewer':
            return request.method in permissions.SAFE_METHODS
        # All other roles can perform any action
        return True
    
    def has_object_permission(self, request, view, obj):
        """Check object-level permission for viewers."""
        if request.user.role == 'viewer':
            return request.method in permissions.SAFE_METHODS
        return True

