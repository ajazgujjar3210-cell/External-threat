"""
Script to check for Organization Admin users and create one if needed.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import User, Organization

# Check for Organization Admin users
org_admins = User.objects.filter(role='org_admin')
print(f"Organization Admins found: {org_admins.count()}")

if org_admins.count() > 0:
    print("\nExisting Organization Admins:")
    for admin in org_admins[:10]:
        org_name = admin.organization.name if admin.organization else "No Org"
        print(f"  - {admin.email} (Org: {org_name}, Active: {admin.is_active})")
else:
    print("\nNo Organization Admin users found.")
    print("Creating a test Organization Admin...")
    
    # Get or create an organization
    org, created = Organization.objects.get_or_create(
        name='Test Organization',
        defaults={
            'status': 'active',
            'admin_email': 'orgadmin@test.com',
            'admin_first_name': 'Test',
            'admin_last_name': 'Admin'
        }
    )
    
    # Create Organization Admin user
    org_admin, created = User.objects.get_or_create(
        email='orgadmin@test.com',
        defaults={
            'username': 'orgadmin',
            'role': 'org_admin',
            'organization': org,
            'is_active': True,
            'first_name': 'Test',
            'last_name': 'Admin'
        }
    )
    
    if created:
        org_admin.set_password('OrgAdmin@123')
        org_admin.save()
        print(f"✅ Created Organization Admin: {org_admin.email}")
        print(f"   Password: OrgAdmin@123")
        print(f"   Organization: {org.name}")
    else:
        print(f"Organization Admin already exists: {org_admin.email}")
        if not org_admin.check_password('OrgAdmin@123'):
            org_admin.set_password('OrgAdmin@123')
            org_admin.save()
            print(f"   Password reset to: OrgAdmin@123")

