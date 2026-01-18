"""
URLs for reports app.
"""
from django.urls import path
from . import views

urlpatterns = [
    path('generate/', views.generate_report, name='generate-report'),
    path('scheduled/', views.ScheduledReportListView.as_view(), name='scheduled-report-list'),
    path('scheduled/<uuid:pk>/', views.ScheduledReportDetailView.as_view(), name='scheduled-report-detail'),
]

