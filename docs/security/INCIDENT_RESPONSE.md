# Incident Response Runbook - Apex Platform
# Date: 2026-02-23
# Version: 3.0 (Fortress Hardening)

## 1. 🔑 Secret Leakage Detected

**Symptoms**: Unauthorized access, secret found in logs/Git history, `docker inspect` exposes plaintext.

### Immediate Steps
```bash
# 1. Rotate the compromised secret on the server
ssh deploy@34.102.121.225
cd /opt/apex-v2

# 2. Generate a new strong secret
NEW_SECRET=$(openssl rand -base64 48)

# 3. Update the secret file
echo "$NEW_SECRET" > ops/secrets/postgres_password.txt  # (or whichever secret)
chmod 600 ops/secrets/postgres_password.txt

# 4. Restart ONLY the affected service (zero-downtime)
sudo docker compose -f ops/docker-compose.prod.yml up -d --no-deps api

# 5. Update .env to match (for future reference)
nano .env   # update the corresponding variable

# 6. Verify no leakage
sudo docker inspect ops-api-1 | grep -i password  # should return nothing
```

---

## 2. 🚨 SSH Key Compromised

**Symptoms**: Unauthorized SSH logins, unfamiliar processes, unkown files on server.

### Immediate Steps
```bash
# 1. Revoke the key immediately on the SERVER
# Remove from authorized_keys:
ssh root@34.102.121.225
sed -i '/apex-deploy/d' ~/.ssh/authorized_keys
sed -i '/apex-deploy/d' /home/deploy/.ssh/authorized_keys

# 2. Generate a new key pair
ssh-keygen -t ed25519 -C "apex-deploy-$(date +%Y%m%d)" -f ops/keys/apex-deploy

# 3. Add new public key to server
ssh-copy-id -i ops/keys/apex-deploy.pub deploy@34.102.121.225

# 4. Update GitHub repository secrets (Settings > Secrets)
# Update: DEPLOY_KEY with the new private key content

# 5. Verify old key is gone
ssh -i ops/keys/apex-deploy-OLD deploy@34.102.121.225  # should FAIL
```

---

## 3. 🕸️ Container Escape / Network Breach

**Symptoms**: Unexpected container restarting, unknown processes inside containers, data exfiltration alerts.

### Immediate Steps
```bash
# 1. Isolate the compromised container
sudo docker pause apex-store  # or whichever container

# 2. Network verification – check isolation is working
sudo docker run --rm --network ops_apex-public alpine nmap -p 5432 172.28.2.x
# Expected: should show "filtered" (no connection to postgres)

# 3. Check capability audit
sudo docker inspect apex-store | python3 -c "import sys,json; d=json.load(sys.stdin); print('CapAdd:', d[0]['HostConfig']['CapAdd'])"
# Expected: null (no extra capabilities)

# 4. Check audit logs for the incident time window
sudo docker logs ops-api-1 --since 2h | grep -E "AUDIT|ERROR|SECURITY"

# 5. Restore from backup if data was tampered
sudo docker exec apex-db-backup pg_restore --host=postgres ...
```

---

## 4. 🔄 Secret Rotation Schedule

| Secret | Rotation Interval | Who Rotates |
|--------|------------------|-------------|
| `JWT_SECRET` | Every 90 days | Lead Dev |
| `POSTGRES_PASSWORD` | Every 180 days | Lead Dev |
| `CF_DNS_API_TOKEN` | If ever leaked | Lead Dev |
| `WEBHOOK_SECRET` | Every 90 days | Lead Dev |
| SSH Deploy Keys | Every 365 days | Lead Dev |

---

## 5. 🧪 Security Verification Commands

```bash
# Test 1: Network Isolation (run from apex-public, should FAIL to reach postgres)
sudo docker run --rm --network ops_apex-public alpine sh -c "nc -zv 172.28.2.x 5432; echo exit:$?"

# Test 2: Secret Leakage Audit
sudo docker inspect ops-api-1 | python3 -c "
import sys, json
c = json.load(sys.stdin)[0]
env = c.get('Config', {}).get('Env', [])
for e in env:
    if any(x in e.lower() for x in ['password','secret','key','token']):
        print('⚠️  Exposed:', e[:60])
"

# Test 3: Capability Audit
for svc in apex-store apex-admin ops-api-1; do
  echo "=== $svc ===" 
  sudo docker inspect $svc | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['HostConfig']['CapAdd'])"
done
# Expected: null for all services except postgres (CHOWN/SETGID/SETUID only)
```
