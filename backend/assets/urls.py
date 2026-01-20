"""
URLs for assets app.
"""
from django.urls import path
from . import views

urlpatterns = [
    path('', views.AssetListView.as_view(), name='asset-list'),
    path('<uuid:pk>/', views.AssetDetailView.as_view(), name='asset-detail'),
    path('changes/', views.asset_changes, name='asset-changes'),
    path('discover/', views.trigger_discovery_scan, name='trigger-discovery'),
    path('unknown/', views.unknown_assets, name='unknown-assets'),
    path('<uuid:asset_id>/mark-known/', views.mark_asset_known, name='mark-asset-known'),
    path('categories/', views.AssetCategoryListView.as_view(), name='asset-category-list'),
    path('categories/<uuid:pk>/', views.AssetCategoryDetailView.as_view(), name='asset-category-detail'),
    path('<uuid:pk>/ownership/', views.OwnershipView.as_view(), name='asset-ownership'),
    path('<uuid:asset_id>/ownership/history/', views.OwnershipHistoryListView.as_view(), name='asset-ownership-history'),
    path('<uuid:pk>/metadata/', views.AssetMetadataView.as_view(), name='asset-metadata'),
    path('dashboard/stats/', views.dashboard_stats, name='dashboard-stats'),
    path('notifications/', views.asset_notifications, name='asset-notifications'),
    path('notifications/unread-count/', views.asset_notifications_unread_count, name='asset-notifications-unread-count'),
    path('changes/export/', views.export_change_logs, name='export-change-logs'),
    path('domains/groups/', views.domain_groups, name='domain-groups'),
    path('domains/hierarchy/', views.domain_hierarchy, name='domain-hierarchy'),
    path('network/graph/', views.asset_network_graph, name='asset-network-graph'),
    path('alerts/configuration/', views.AlertConfigurationView.as_view(), name='alert-configuration'),
    path('alerts/rules/', views.AlertRuleListView.as_view(), name='alert-rule-list'),
    path('alerts/rules/<uuid:pk>/', views.AlertRuleDetailView.as_view(), name='alert-rule-detail'),
]

