# Deploy MeetFlow AI

Pushes to `main` build the API/worker and frontend on GitHub's Linux runner,
publish commit-tagged GHCR images, and SSH to `/opt/meetflow`. EC2 only pulls
images, runs `prisma migrate deploy`, and starts Compose services. No builds,
database resets, volume deletion, or pruning run on EC2.

## One-time EC2 setup

Use Ubuntu with Docker Engine and the Docker Compose v2 plugin. The images target
Linux amd64; use an x86_64 EC2 instance. As the SSH user (normally `ubuntu`):

```bash
sudo mkdir -p /opt/meetflow
sudo chown "$(id -un):$(id -gn)" /opt/meetflow
sudo usermod -aG docker "$(id -un)"
```

Reconnect SSH so group membership applies. Allow inbound TCP 80 and 443 from
the internet in the EC2 security group and any enabled Ubuntu firewall. Allow
TCP 22 from the deployment runner (standard GitHub-hosted runners have changing
source IPs). Keep PostgreSQL, Redis and API ports private. Outbound internet is
required for GHCR, certificate issuance, OpenAI and optional Google integration.

## GitHub repository secrets

Under Settings > Secrets and variables > Actions, create:

| Secret | Value / source |
| --- | --- |
| `EC2_HOST` | Instance public IPv4 or public DNS from AWS EC2 console |
| `EC2_USER` | `ubuntu` for the Ubuntu AMI, or your configured SSH user |
| `EC2_SSH_KEY` | Complete unencrypted private PEM/OpenSSH key whose public key is authorized for that user; never commit it |
| `EC2_KNOWN_HOSTS` | Verified SSH host public key line; see below |
| `PRODUCTION_ENV` | Entire filled contents of `.env.production.example`, entered directly in the secret editor |

No GHCR personal token is needed: the workflow uses GitHub's automatic
`GITHUB_TOKEN` for publishing and temporary EC2 pulls, then logs EC2 out.
If GHCR packages already exist, grant this repository Actions access to them.

For `EC2_KNOWN_HOSTS`, obtain the server's public host key over an already trusted
SSH connection or AWS Session Manager/console (replace PUBLIC_IP with EC2_HOST):

```bash
printf '%s ' 'PUBLIC_IP'; cat /etc/ssh/ssh_host_ed25519_key.pub
```

Copy the resulting single line. This is a public host key, not a private key.

In `PRODUCTION_ENV`, set `APP_HOST=meetflow.PUBLIC-IP-WITH-DASHES.sslip.io`
(for example `meetflow.203-0-113-10.sslip.io`, replacing the documentation IP),
`ACME_EMAIL` to your email, and `OPENAI_API_KEY` from your OpenAI project's API
keys page. Generate separate values for `POSTGRES_PASSWORD` and
`JWT_ACCESS_SECRET` with `openssl rand -hex 32` on EC2; keep both stable on later
deployments. All other required app URLs are derived by Compose. Leave optional
Google settings empty unless configuring Calendar OAuth; its callback is
`https://APP_HOST/api/v1/integrations/calendar/callback`. The Calendar encryption
key must be 32 random bytes encoded as hex; generate another independent value.

The free sslip.io hostname automatically resolves the embedded public IP; no
account or DNS records are needed. Caddy obtains and renews HTTPS certificates.
Keep the public IP stable (an AWS Elastic IP has AWS charges); if it changes,
update EC2_HOST, EC2_KNOWN_HOSTS and APP_HOST and redeploy. DNS service and CA
availability/rate limits apply. See https://sslip.io/.

## Deploy and verify

After adding secrets, open the Deploy MeetFlow workflow and select Run workflow
on `main` (or rerun the failed run):
https://github.com/Jibrand/MeetFlow-8x/actions/workflows/deploy.yml

Both build and deploy jobs must succeed. Visit `https://APP_HOST/`, register the
initial admin if needed, log in, and check `https://APP_HOST/api/health`. Verify a
meeting upload/processing job to exercise OpenAI and the worker. On EC2:

```bash
cd /opt/meetflow
docker compose --env-file .env.production --env-file images.env -f docker-compose.prod.yml ps
docker compose --env-file .env.production --env-file images.env -f docker-compose.prod.yml logs --tail=100 api worker proxy
```

Named volumes preserve PostgreSQL, Redis jobs, uploads and Caddy certificates.
Do not run `down -v`, reset migrations, or change database credentials on an
initialized volume. This stack creates its own local PostgreSQL database; it
does not import existing Neon/external database records or local uploads. An
existing nonempty database without matching Prisma migration records requires
reviewed baselining before deploy; the workflow fails rather than resetting it.
Existing migration files remain intact, including the prepared initial baseline.
Migration failures stop deployment and leave app writers stopped for inspection.

Only source inspection and Git diff checks were performed locally, as requested;
image builds and application compilation happen in GitHub Actions.
