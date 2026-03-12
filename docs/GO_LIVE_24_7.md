# PetHub Go-Live 24/24 Checklist

## 1) Network and edge
- Public ingress: open only `80` and `443` in Oracle (no need public `4000`).
- Keep backend private behind Nginx reverse proxy.
- Verify externally:
  - `http://<public-ip>/api/health`
  - `http://<public-ip>/`

## 2) Runtime hardening
- Docker services already use `restart: always`.
- Install and enable `fail2ban` for SSH brute-force protection.
- Set up automatic health watchdog (`scripts/health-check.sh`) via cron every 5 minutes.

## 3) Backup and recovery
- Run `scripts/backup-db.sh` daily at 02:00.
- Keep 7 days of compressed PostgreSQL dumps in `/home/ubuntu/pethub/backups/postgres`.
- Test restore monthly on a staging database.

## 4) SSL
- Let's Encrypt requires a real domain pointing to this VPS IP.
- Without domain, keep HTTP for now or use self-signed cert only for internal testing.

## 5) Suggested cron
```cron
*/5 * * * * /home/ubuntu/pethub/scripts/health-check.sh >> /home/ubuntu/pethub/logs/health-check.log 2>&1
0 2 * * * /home/ubuntu/pethub/scripts/backup-db.sh >> /home/ubuntu/pethub/logs/backup-db.log 2>&1
```
