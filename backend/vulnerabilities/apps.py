from django.apps import AppConfig


class VulnerabilitiesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'vulnerabilities'
    
    def ready(self):
        import vulnerabilities.signals  # noqa
