"""
Script to create a super admin user automatically.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import User

def create_admin():
    email = 'admin@easm.local'
    username = 'admin'
    password = 'Admin@123'
    
    if User.objects.filter(email=email).exists():
        user = User.objects.get(email=email)
        user.set_password(password)
        user.role = 'super_admin'
        user.is_staff = True
        user.is_superuser = True
        user.save()
        print(f"\n[SUCCESS] Super admin updated!")
    else:
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            role='super_admin'
        )
        user.is_staff = True
        user.is_superuser = True
        user.save()
        print(f"\n[SUCCESS] Super admin created!")
    
    print(f"Email: {user.email}")
    print(f"Username: {user.username}")
    print(f"Password: {password}")
    print(f"Role: {user.role}")
    print(f"\n=== LOGIN CREDENTIALS ===")
    print(f"   Email: {email}")
    print(f"   Password: {password}")

if __name__ == '__main__':
    create_admin()

