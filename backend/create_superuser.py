"""
Script to create a super admin user.
Run: python create_superuser.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import User

def create_superuser():
    email = input("Email: ")
    username = input("Username: ")
    password = input("Password: ")
    
    if User.objects.filter(email=email).exists():
        print(f"User with email {email} already exists!")
        return
    
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        role='super_admin'
    )
    user.is_staff = True
    user.is_superuser = True
    user.save()
    
    print(f"\n✅ Super admin created successfully!")
    print(f"Email: {user.email}")
    print(f"Username: {user.username}")
    print(f"Role: {user.role}")

if __name__ == '__main__':
    create_superuser()

