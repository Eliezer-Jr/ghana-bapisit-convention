# Docker Deployment Guide

This project supports multiple deployment environments using Docker.

## Setup

1. Copy the example environment file:
   ```bash
   cp .env.docker.example .env.docker
   ```

2. Update `.env.docker` with your Supabase credentials

## Deployment Commands

### Development Environment
```bash
docker-compose -f docker-compose.dev.yml --env-file .env.docker up -d
```

### Staging Environment
```bash
docker-compose -f docker-compose.staging.yml --env-file .env.docker up -d
```

### Production Environment
```bash
docker-compose -f docker-compose.prod.yml --env-file .env.docker up -d
```

## Rebuild and Deploy

To rebuild and deploy:
```bash
docker-compose -f docker-compose.prod.yml --env-file .env.docker up -d --build
```

## Stop Services

```bash
docker-compose -f docker-compose.prod.yml down
```

## Environment Differences

- **Development**: Port 8080, restart policy: unless-stopped
- **Staging**: Port 8080, restart policy: always
- **Production**: Port 80, restart policy: always, resource limits enabled

## Notes

- The `.env.docker` file should NOT be committed to version control
- Environment variables are baked into the build at build time
- For production, ensure proper SSL/TLS termination via reverse proxy (nginx, traefik, etc.)
