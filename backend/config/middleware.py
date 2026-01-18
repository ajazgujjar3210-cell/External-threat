"""
Custom middleware for security controls.
"""
from django.utils.deprecation import MiddlewareMixin
from django.core.cache import cache
from django.http import JsonResponse
from django.conf import settings
import time


class RateLimitMiddleware(MiddlewareMixin):
    """
    Simple rate limiting middleware.
    """
    def process_request(self, request):
        # Only rate limit API endpoints
        if not request.path.startswith('/api/'):
            return None
        
        # Skip rate limiting for admin endpoints
        if request.path.startswith('/api/auth/login'):
            # More lenient for login
            limit = 10  # 10 requests
            window = 60  # per minute
        else:
            limit = 100  # 100 requests
            window = 60  # per minute
        
        # Get client IP
        ip = self.get_client_ip(request)
        cache_key = f'rate_limit_{ip}_{int(time.time() / window)}'
        
        # Check current count
        count = cache.get(cache_key, 0)
        
        if count >= limit:
            return JsonResponse(
                {'error': 'Rate limit exceeded. Please try again later.'},
                status=429
            )
        
        # Increment count
        cache.set(cache_key, count + 1, window)
        
        return None
    
    def get_client_ip(self, request):
        """Get client IP address."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

