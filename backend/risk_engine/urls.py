"""
URLs for risk engine app.
"""
from django.urls import path
from . import views

urlpatterns = [
    path('', views.RiskScoreListView.as_view(), name='risk-score-list'),
    path('top/', views.top_risks, name='top-risks'),
    path('<uuid:pk>/', views.RiskScoreDetailView.as_view(), name='risk-score-detail'),
]

