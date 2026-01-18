"""
URLs for vulnerabilities app.
"""
from django.urls import path
from . import views

urlpatterns = [
    path('', views.VulnerabilityListView.as_view(), name='vulnerability-list'),
    path('<uuid:pk>/', views.VulnerabilityDetailView.as_view(), name='vulnerability-detail'),
]

