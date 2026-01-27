

# Fix: VPS "Bad Gateway" - Broken nginx.conf Syntax

## Problem Identified

Your `nginx.conf` file has **invalid NGINX syntax** that prevents NGINX from starting:

```nginx
server {
    listen 80;
    ...
    location / {
        try_files $uri $uri/ /index.html;
    }
}

  location / {           <-- ORPHAN BLOCK (not inside any server block!)
        proxy_pass http://web:80;
        ...
    }


server {
    listen 443 ssl;
    ...
}
```

**Lines 30-36** contain a `location` block that exists **outside** of any `server` block. This is invalid NGINX syntax and will cause NGINX to fail configuration validation, preventing the container from starting properly.

---

## Root Cause

It appears that a reverse-proxy configuration was accidentally added to this file, but:
1. This file is for the **Docker container's internal NGINX** (serving static files)
2. The reverse proxy configuration (`proxy_pass http://web:80`) belongs in **Dokploy's reverse proxy** or a separate host NGINX config
3. The orphan `location` block breaks NGINX entirely

---

## Solution

Remove the orphan blocks and keep only the valid SPA configuration for the Docker container:

### Corrected `nginx.conf`:

```nginx
server {
    listen 80;
    server_name ghanabaptistministers.com;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing - redirect all requests to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## What to Remove

Delete these lines (29-52 in the current file):

```nginx
  location / {
        proxy_pass http://web:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }


server {
    listen 443 ssl;
    server_name ghanabaptistministers.com;
        ssl_certificate /etc/letsencrypt/live/ghanabaptistministers.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ghanabaptistministers.com/privkey.pem;

    location / {
        proxy_pass http://web:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Why This Configuration Was Wrong

| What's in the file | Where it belongs |
|---|---|
| `try_files $uri $uri/ /index.html;` | Docker container NGINX (correct) |
| `proxy_pass http://web:80;` | Dokploy/Host reverse proxy (wrong file) |
| SSL certificate paths | Host-level NGINX or Dokploy config (wrong file) |

The Docker container doesn't have access to `/etc/letsencrypt/` certificates - SSL termination is handled by Dokploy.

---

## After the Fix

1. **Rebuild and redeploy** via Dokploy after this change
2. Dokploy handles SSL termination and proxying to your container
3. The container NGINX only needs to serve static files and handle SPA routing

---

## Technical Summary

| File | Purpose |
|---|---|
| `nginx.conf` | Inside Docker container - serves built React app, handles SPA routing |
| Dokploy config | On host - handles SSL, proxies to container port 80 |

The fix simply removes the misplaced reverse-proxy configuration that was breaking NGINX syntax.

