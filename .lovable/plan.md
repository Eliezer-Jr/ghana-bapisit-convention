

# Fix: Bad Gateway - Dokploy Port Mismatch

## Root Cause

Your container is running and healthy, but Dokploy is forwarding traffic to the wrong port.

```text
+----------------+       +------------------+       +-------------------+
|   Internet     | ----> |    Dokploy       | ----> |   Container       |
|                |       | (reverse proxy)  |       |   Port ???        |
+----------------+       +------------------+       +-------------------+
                              Forwards to                  |
                              wrong port!                  v
                                                    NGINX listening
                                                    on port 80
```

The container's NGINX listens on **port 80**, but Dokploy is configured to send traffic to a different port (likely 3000 or 5173 from development defaults).

---

## Solution: Update Dokploy Configuration

### Step 1: Open Dokploy Dashboard

1. Go to your Dokploy dashboard
2. Navigate to your application/project

### Step 2: Update the Internal Port

1. Find the **Domains** or **Network** settings for your app
2. Look for **"Internal Port"**, **"Container Port"**, or **"Target Port"**
3. Change it from the current value to: **80**

Depending on your Dokploy version, this setting may be in:
- **General tab** > Application Port
- **Domains tab** > Port field
- **Advanced tab** > Container Port

### Step 3: Save and Redeploy

1. Save the changes
2. Click **Redeploy** or **Restart** the application
3. Wait for the container to become healthy again

---

## Visual Guide for Dokploy

```text
Dokploy Settings
+--------------------------------------------------+
| Application: ghanabaptistministers               |
+--------------------------------------------------+
| General                                          |
|   Application Port: [ 80 ]  <-- Change this!    |
|                                                  |
| Domains                                          |
|   Domain: ghanabaptistministers.com             |
|   HTTPS: Enabled                                 |
|   Internal Port: [ 80 ]  <-- Or this one!       |
+--------------------------------------------------+
```

---

## Why This Happens

- Development servers (Vite) run on ports like 3000 or 5173
- Dokploy may have defaulted to a development port
- The production Docker image uses NGINX on port 80
- The port must match between Dokploy and the container

---

## Verification

After making the change:

1. Wait 30-60 seconds for the container to be ready
2. Visit your domain: `https://ghanabaptistministers.com`
3. You should see the login/apply page

If it still doesn't work, check:
- Container logs in Dokploy for any errors
- That HTTPS/SSL is properly configured in Dokploy

---

## No Code Changes Required

The Docker files in the repository are correct:

| File | Status |
|------|--------|
| `nginx.conf` | Correct - listens on port 80 |
| `Dockerfile` | Correct - exposes port 80 |
| `docker-compose.yml` | Correct - maps port 80 |

The only change needed is in **Dokploy's configuration** to set the internal port to **80**.

