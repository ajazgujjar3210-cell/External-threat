"""
URLs for integrations app.
"""
from django.urls import path
from . import views

urlpatterns = [
    path('docs/', views.api_documentation, name='api-docs'),
    path('import/assets/', views.import_assets, name='import-assets'),
    path('export/', views.export_data, name='export-data'),
]

