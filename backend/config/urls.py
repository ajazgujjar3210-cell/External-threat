"""
URL configuration for EASM Platform.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from .views import root

urlpatterns = [
    path('', root, name='root'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/assets/', include('assets.urls')),
    path('api/vulnerabilities/', include('vulnerabilities.urls')),
    path('api/risks/', include('risk_engine.urls')),
    path('api/scans/', include('scans.urls')),
    path('api/reports/', include('reports.urls')),
    path('api/audit/', include('audit.urls')),
    path('api/integrations/', include('integrations.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

