"""
Signals for accounts app.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from .models import User


@receiver(post_save, sender=User)
def send_welcome_email_on_user_creation(sender, instance, created, **kwargs):
    """
    Send welcome email when a new user is created.
    Only sends email if user was just created and email is configured.
    """
    if not created:
        return
    
    # Skip if email backend is console (for development)
    if settings.EMAIL_BACKEND == 'django.core.mail.backends.console.EmailBackend':
        return
    
    # Skip if email is not configured
    if not settings.EMAIL_HOST_USER or not settings.EMAIL_HOST_PASSWORD:
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Email not configured. Welcome email not sent to {instance.email}")
        return
    
    try:
        subject = 'Welcome to EASM Platform - Account Created'
        
        role_display = dict(instance.ROLE_CHOICES).get(instance.role, instance.role)
        
        message = f"""
Your account has been successfully created on the EASM Platform.

Email: {instance.email}
Role: {role_display}

You can now log in to the platform using your credentials.

Best regards,
EASM Platform Team
"""
        
        html_message = f"""
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1e40af;">Welcome to EASM Platform</h2>
        <p>Your account has been successfully created!</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Email:</strong> {instance.email}</p>
            <p style="margin: 5px 0;"><strong>Role:</strong> {role_display}</p>
        </div>
        <p>You can now log in to the platform using your credentials.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">Best regards,<br>EASM Platform Team</p>
    </div>
</body>
</html>
"""
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL or settings.EMAIL_HOST_USER,
            recipient_list=[instance.email],
            html_message=html_message,
            fail_silently=True  # Don't fail user creation if email fails
        )
        
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Welcome email sent to {instance.email}")
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to send welcome email to {instance.email}: {str(e)}")

