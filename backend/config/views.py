"""
Root views for the EASM platform.
"""
from django.http import JsonResponse
from django.shortcuts import redirect


def root(request):
    """Root endpoint - redirect to admin or show API info."""
    if request.path == '/':
        return JsonResponse({
            'name': 'EASM Platform API',
            'version': '1.0',
            'description': 'External Threat Surface Management Platform',
            'endpoints': {
                'admin': '/admin/',
                'api': {
                    'auth': '/api/auth/',
                    'assets': '/api/assets/',
                    'vulnerabilities': '/api/vulnerabilities/',
                    'risks': '/api/risks/',
                    'scans': '/api/scans/',
                    'reports': '/api/reports/',
                    'audit': '/api/audit/',
                    'integrations': '/api/integrations/',
                },
                'documentation': '/api/integrations/docs/',
            },
            'frontend': 'http://localhost:5173',
        })
    return redirect('/admin/')


