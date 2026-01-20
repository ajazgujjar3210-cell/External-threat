"""
Check which users will receive discovery completion emails.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import User
from accounts.models import Organization

print("=" * 70)
print("CHECKING EMAIL RECIPIENTS FOR DISCOVERY COMPLETION")
print("=" * 70)

# Check all organizations
organizations = Organization.objects.all()
print(f"\nTotal Organizations: {organizations.count()}\n")

for org in organizations:
    print(f"Organization: {org.name}")
    print("-" * 70)
    
    # Check org_admin users
    org_admins = User.objects.filter(
        organization=org,
        role='org_admin',
        is_active=True
    )
    
    print(f"  Org Admins: {org_admins.count()}")
    for admin in org_admins:
        print(f"    - {admin.email} (Active: {admin.is_active})")
    
    # If no org_admin, check super_admin
    if not org_admins.exists():
        super_admins = User.objects.filter(
            role='super_admin',
            is_active=True
        )
        print(f"  Super Admins (fallback): {super_admins.count()}")
        for admin in super_admins:
            print(f"    - {admin.email} (Active: {admin.is_active})")
    
    print()

print("=" * 70)
print("SUMMARY")
print("=" * 70)
total_org_admins = User.objects.filter(role='org_admin', is_active=True).count()
total_super_admins = User.objects.filter(role='super_admin', is_active=True).count()
print(f"Total Org Admins: {total_org_admins}")
print(f"Total Super Admins: {total_super_admins}")

if total_org_admins == 0 and total_super_admins == 0:
    print("\nWARNING: No active admin users found! Discovery emails will not be sent.")
elif total_org_admins == 0:
    print("\nNOTE: No org_admin users found. Emails will be sent to super_admin users instead.")

