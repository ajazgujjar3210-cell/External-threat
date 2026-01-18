# Docker Services for EASM Platform

## Services

1. **PostgreSQL** - Database (port 5432)
2. **Redis** - Celery broker and cache (port 6379)

## Quick Start

### Start all services:
```bash
cd docker
docker-compose up -d
```

### Stop all services:
```bash
docker-compose down
```

### View logs:
```bash
docker-compose logs -f
```

### Check status:
```bash
docker-compose ps
```

## Database Connection

When using Docker PostgreSQL:
- Host: `localhost`
- Port: `5432`
- Database: `easm_db`
- User: `easm_user`
- Password: `eas

m_password`

Update your `.env` file:
```
DATABASE_URL=postgresql://easm_user:easm_password@localhost:5432/easm_db
```

## Redis Connection

When using Docker Redis:
- Host: `localhost`
- Port: `6379`

Update your `.env` file:
```
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

## Troubleshooting

### Services not starting:
1. Check if ports are already in use
2. Check Docker logs: `docker-compose logs`
3. Restart Docker Desktop

### Database connection issues:
1. Verify PostgreSQL is running: `docker ps`
2. Check database credentials
3. Verify port 5432 is not blocked

### Redis connection issues:
1. Verify Redis is running: `docker ps`
2. Check port 6379 is not blocked
3. Restart Redis: `docker restart easm-redis`


