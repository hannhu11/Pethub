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

## 2) Fix `Request failed with status code 502` on register
If register hits `POST /api/auth/sync-firebase` and returns 502, usually Nginx cannot reach API or API is missing Firebase Admin credentials.

### A. Ensure API has Firebase Admin credentials
Generate Firebase service account key JSON from:
`Firebase Console -> Project settings -> Service accounts -> Generate new private key`

Upload key to VPS:
```bash
mkdir -p /home/ubuntu/pethub/secrets
chmod 700 /home/ubuntu/pethub/secrets
# copy firebase-admin.json into /home/ubuntu/pethub/secrets/firebase-admin.json
chmod 600 /home/ubuntu/pethub/secrets/firebase-admin.json
```

Or use helper script:
```bash
cd /home/ubuntu/pethub
bash scripts/install-firebase-admin.sh /home/ubuntu/Downloads/firebase-admin.json
```

Set env in `/home/ubuntu/pethub/.env.production`:
```env
FIREBASE_SERVICE_ACCOUNT_PATH=/home/ubuntu/pethub/secrets/firebase-admin.json
```

### B. Rebuild backend and restart nginx
```bash
cd /home/ubuntu/pethub
sudo docker compose --env-file .env.production -f docker-compose.production.yml up -d --build api worker nginx
```

### C. Verify
```bash
curl -i http://140.245.119.189/api/health
```
Expected: `HTTP/1.1 200 OK`.

## 3) Fix `Firebase: Error (auth/invalid-credential)` on login
This means Firebase Auth rejected email/password.
- Common reasons: wrong password, account not created, or account created in another Firebase project.
- Check in `Firebase Console -> Authentication -> Users`:
  - user email exists
  - use `Reset password` to verify credentials quickly

If register previously failed at sync step, Firebase user may still exist but app profile was not synced. After fixing section 2, login again and sync will complete.

## 4) Where admin checks user login accounts
- Source of truth for login identities: Firebase Console -> `Authentication` -> `Users`.
- You can view email, created date, last sign-in, and disable/delete user.
- Passwords are never visible (hashed by Firebase by design).

## 5) Where admin checks customer business data
- PetHub manager UI (`/manager`) for customers, pets, appointments and revenue.
- PostgreSQL tables:
  - `"User"`: identity + role mapping
  - `"Customer"`: customer profile and spending
  - `"Pet"`: pet profiles
  - `"Appointment"`: bookings

## 6) Role policy in current build
- Public registration always creates `customer`.
- `manager` is not self-registerable from public forms.
- To promote a user to manager, run on VPS:
```bash
cd /home/ubuntu/pethub
sudo docker exec -i pethub-postgres psql -U pethub -d pethub -c "UPDATE \"User\" SET role='manager' WHERE email='manager-email@example.com';"
```

## 7) Quick troubleshooting command reminder
In shell, URL is not a command. Use `curl`:
```bash
curl http://140.245.119.189/api/health
```
