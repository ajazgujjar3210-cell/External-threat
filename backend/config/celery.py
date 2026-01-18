"""
Celery configuration for EASM Platform.
"""
import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('easm')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Celery Beat Schedule
app.conf.beat_schedule = {
    'calculate-asset-aging': {
        'task': 'assets.tasks.calculate_asset_aging',
        'schedule': crontab(hour=2, minute=0),  # Daily at 2 AM
    },
    'calculate-vulnerability-aging': {
        'task': 'assets.tasks.calculate_vulnerability_aging',
        'schedule': crontab(hour=2, minute=30),  # Daily at 2:30 AM
    },
    'recalculate-all-risks': {
        'task': 'risk_engine.calculator.recalculate_all_risks',
        'schedule': crontab(hour=3, minute=0),  # Daily at 3 AM
    },
    'run-scheduled-reports': {
        'task': 'reports.tasks.run_scheduled_reports',
        'schedule': crontab(hour=8, minute=0),  # Daily at 8 AM
    },
}

