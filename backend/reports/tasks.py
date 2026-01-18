"""
Scheduled report tasks.
"""
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from .models import ScheduledReport
from .generator import (
    generate_asset_inventory_report,
    generate_risk_summary_report,
    generate_vulnerability_report
)
from .compliance import (
    generate_iso27001_report,
    generate_pci_dss_report,
    generate_sbp_report
)
from scans.alerts import send_alert_email


@shared_task
def run_scheduled_reports():
    """
    Run all due scheduled reports.
    """
    now = timezone.now()
    due_reports = ScheduledReport.objects.filter(
        is_active=True,
        next_run__lte=now
    )
    
    executed = 0
    for report in due_reports:
        try:
            # Generate report
            if report.report_type == 'inventory':
                response = generate_asset_inventory_report(report.organization, report.format_type)
            elif report.report_type == 'risk':
                response = generate_risk_summary_report(report.organization, report.format_type)
            elif report.report_type == 'vulnerabilities':
                response = generate_vulnerability_report(report.organization, report.format_type)
            elif report.report_type == 'iso27001':
                response = generate_iso27001_report(report.organization, report.format_type)
            elif report.report_type == 'pci_dss':
                response = generate_pci_dss_report(report.organization, report.format_type)
            elif report.report_type == 'sbp':
                response = generate_sbp_report(report.organization, report.format_type)
            else:
                continue
            
            # Send email with report (if email configured)
            # For now, just update the schedule
            report.last_run = now
            
            # Calculate next run
            if report.frequency == 'daily':
                report.next_run = now + timedelta(days=1)
            elif report.frequency == 'weekly':
                report.next_run = now + timedelta(weeks=1)
            elif report.frequency == 'monthly':
                report.next_run = now + timedelta(days=30)
            
            report.save()
            executed += 1
            
        except Exception as e:
            # Log error but continue
            print(f"Error executing scheduled report {report.id}: {e}")
    
    return f"Executed {executed} scheduled reports"

