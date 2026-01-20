"""
Script to send welcome email to user.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.core.mail import send_mail
from django.conf import settings

def send_welcome_email():
    email = 'ajazgujjar3210@gmail.com'
    password = 'Dont00786@'
    
    subject = 'Welcome to EASM Platform - Account Created'
    
    message = f"""
Your account has been successfully created on the EASM Platform.

Login Credentials:
Email: {email}
Password: {password}

You can now log in to the platform using these credentials.

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
            <p style="margin: 5px 0;"><strong>Email:</strong> {email}</p>
            <p style="margin: 5px 0;"><strong>Password:</strong> {password}</p>
        </div>
        <p>You can now log in to the platform using these credentials.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">Best regards,<br>EASM Platform Team</p>
    </div>
</body>
</html>
"""
    
    try:
        # Set email password from environment or use provided one
        import os
        if not os.environ.get('EMAIL_HOST_PASSWORD'):
            os.environ['EMAIL_HOST_PASSWORD'] = 'yridogxcztouhxji'
        
        # Update settings with the password
        from django.conf import settings
        settings.EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', 'yridogxcztouhxji')
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL or settings.EMAIL_HOST_USER or 'tufailijaz353@gmail.com',
            recipient_list=[email],
            html_message=html_message,
            fail_silently=False
        )
        print(f"Welcome email sent successfully to {email}!")
        return True
    except Exception as e:
        print(f"Failed to send email: {str(e)}")
        print("\nNote: Email sending requires proper SMTP configuration.")
        print("Check your EMAIL_HOST_USER and EMAIL_HOST_PASSWORD in settings.")
        return False

if __name__ == '__main__':
    send_welcome_email()

