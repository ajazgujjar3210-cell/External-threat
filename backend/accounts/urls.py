"""
URLs for accounts app.
"""
from django.urls import path
from . import views

urlpatterns = [
    # Authentication
    path('login/', views.login, name='login'),
    path('refresh/', views.refresh_token, name='refresh'),
    path('me/', views.me, name='me'),
    
    # MFA
    path('mfa/setup/', views.mfa_setup, name='mfa-setup'),
    path('mfa/disable/', views.mfa_disable, name='mfa-disable'),
    
    # Organizations (Super Admin only)
    path('orgs/', views.OrganizationListCreateView.as_view(), name='org-list-create'),
    path('orgs/<uuid:pk>/', views.OrganizationDetailView.as_view(), name='org-detail'),
    
    # Users (Org Admin only)
    path('users/', views.UserListCreateView.as_view(), name='user-list-create'),
    path('users/<uuid:pk>/', views.UserDetailView.as_view(), name='user-detail'),
]

