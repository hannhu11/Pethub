# Authentication and Admin Guide

## 1) Fix `Firebase: Error (auth/configuration-not-found)`
This error means Firebase Authentication is not configured for your project.

Do this in Firebase Console:
1. Open project `pethub-9c257`.
2. Go to `Authentication` -> `Get started`.
3. In `Sign-in method`, enable `Email/Password`.
4. In `Settings` -> `Authorized domains`, add:
   - `140.245.119.189`
   - your future production domain (for example `app.yourdomain.vn`)

Then rebuild frontend on VPS:
```bash
cd /home/ubuntu/pethub
sudo docker compose --env-file .env.production -f docker-compose.production.yml up -d --build web nginx
```

## 2) Where admin checks user login accounts
- Source of truth for login identities: Firebase Console -> `Authentication` -> `Users`.
- You can view email, created date, last sign-in, and disable/delete user.
- Passwords are never visible (hashed by Firebase by design).

## 3) Where admin checks customer business data
- PetHub manager UI (`/manager`) for customers, pets, appointments and revenue.
- PostgreSQL tables:
  - `"User"`: identity + role mapping
  - `"Customer"`: customer profile and spending
  - `"Pet"`: pet profiles
  - `"Appointment"`: bookings

## 4) Role policy in current build
- Public registration always creates `customer`.
- `manager` is not self-registerable from public forms.
- To promote a user to manager, run on VPS:
```bash
cd /home/ubuntu/pethub
sudo docker exec -i pethub-postgres psql -U pethub -d pethub -c "UPDATE \"User\" SET role='manager' WHERE email='manager-email@example.com';"
```

## 5) Quick troubleshooting command reminder
In shell, URL is not a command. Use `curl`:
```bash
curl http://140.245.119.189/api/health
```
