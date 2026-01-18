"""
URLs for scans app.
"""
from django.urls import path
from . import views

urlpatterns = [
    path('', views.ScanRunListView.as_view(), name='scan-run-list'),
    path('<uuid:pk>/', views.ScanRunDetailView.as_view(), name='scan-run-detail'),
    path('<uuid:scan_id>/stop/', views.stop_scan, name='scan-run-stop'),
]
