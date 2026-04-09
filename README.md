# Production-Grade URL Shortener (Beginner Friendly)

This project gives you a **minimal URL shortener app** and a **high-quality DevOps pipeline**.

Tech stack:
- Frontend: React + Vite + TypeScript
- Backend: Node.js + Express + TypeScript
- DB: MongoDB Atlas (free tier)
- CI/CD: Jenkins + Docker + Docker Hub + AWS EC2
- Alerts: Slack Webhook notifications

---

## 0) What You Will Build

Features:
- `POST /shorten`: generate a short URL
- `GET /:code`: redirect to original URL
- `GET /stats/:code`: clicks analytics
- Optional expiry (`expiresAt`) support

DevOps quality:
- Multi-stage Dockerfiles (frontend + backend)
- Local `docker-compose` setup
- Jenkins pipeline with test, build, push, deploy
- EC2 deployment automation
- Slack success/failure notifications

---

## 1) Project Setup (Code)

### 1.1 Folder structure

```txt
.
+-- backend/
+-- frontend/
+-- infra/
¦   +-- scripts/
+-- Jenkinsfile
+-- docker-compose.yml
+-- README.md
```

### 1.2 Backend environment setup

Copy env example:

```bash
cp backend/.env.example backend/.env
```

Update MongoDB for local docker:

```env
MONGODB_URI=mongodb://mongo:27017/url_shortener
BASE_URL=http://localhost:5000
```

### 1.3 Frontend environment setup

```bash
cp frontend/.env.example frontend/.env
```

---

## 2) Local Development

### 2.1 Run without Docker

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend (new terminal):

```bash
cd frontend
npm install
npm run dev
```

What you should see:
- Backend terminal: `Server is running on port 5000`
- Frontend terminal: Vite URL like `http://localhost:5173`

Screenshot description:
- Terminal with backend log + browser open at frontend page with URL input.

### 2.2 Quick API test

```bash
curl -X POST http://localhost:5000/shorten -H "Content-Type: application/json" -d '{"url":"https://google.com"}'
```

Expected JSON:

```json
{
  "code": "abc1234",
  "shortUrl": "http://localhost:5000/abc1234",
  "originalUrl": "https://google.com",
  "expiresAt": null
}
```

---

## 3) Docker Setup

### 3.1 Why Docker here?
- Same runtime everywhere (local, Jenkins, EC2)
- Reduces "works on my machine" issues
- Easier deployment rollback with tags

### 3.2 Start local stack

```bash
docker compose up --build -d
```

Check containers:

```bash
docker compose ps
```

Expected:
- `urlshortener-mongo` running
- `urlshortener-backend` running
- `urlshortener-frontend` running

Open:
- Frontend: `http://localhost:5173`
- API health: `http://localhost:5000/health`

Stop stack:

```bash
docker compose down
```

Troubleshooting:
- If port in use: change ports in `docker-compose.yml`
- If backend cannot connect DB: confirm `MONGODB_URI` and mongo container is healthy

---

## 4) GitHub Setup

### 4.1 Create repository
1. Create new GitHub repo (public/private).
2. Initialize local git and push.

Commands:

```bash
git init
git add .
git commit --trailer "Made-with: Cursor" -m "Initial URL shortener with CI/CD"
git branch -M main
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

### 4.2 Branch strategy
- `main`: production-ready code only
- `dev`: integration branch for daily work
- feature branches: `feature/<name>` merge into `dev`
- promote `dev` -> `main` after verification

### 4.3 Secrets management
Never store secrets in code.
Use:
- Jenkins Credentials for Docker Hub, EC2 key, Slack webhook
- AWS security groups + key pair
- MongoDB Atlas IP allow list and DB user credentials

---

## 5) Jenkins Installation (Beginner, from Zero)

You can run Jenkins in Docker on your own machine or EC2.

### 5.1 Local Jenkins (recommended for learning)

```bash
docker run -d --name jenkins \
  -p 8080:8080 -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  jenkins/jenkins:lts
```

Open: `http://localhost:8080`

Get initial admin password:

```bash
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

Install suggested plugins, then create admin user.

Screenshot description:
- Jenkins unlock page showing password input.

### 5.2 Required Jenkins plugins
Install these in "Manage Jenkins > Plugins":
- Pipeline
- Git
- Docker Pipeline
- SSH Agent
- Credentials Binding

### 5.3 Add Jenkins Credentials
Manage Jenkins > Credentials > Global > Add:

1. `dockerhub-creds` (Username/Password)
2. `ec2-ssh-key` (SSH Username with private key)
3. Environment variables in pipeline/job:
   - `DOCKERHUB_USERNAME`
   - `EC2_HOST`
   - `EC2_USER`
   - `SLACK_WEBHOOK_URL`

---

## 6) CI/CD Pipeline Creation

Pipeline file is `Jenkinsfile`.

Stages:
1. Checkout
2. Install backend dependencies
3. Run tests
4. Build Docker images
5. Push images to Docker Hub
6. Deploy to EC2 through SSH script
7. Slack notifications (success/failure)

### 6.1 Create pipeline job
1. New Item -> Pipeline
2. Pipeline definition: "Pipeline script from SCM"
3. SCM: Git
4. Repo URL: your repo
5. Script path: `Jenkinsfile`
6. Save -> Build Now

Screenshot description:
- Jenkins job page showing green check build and stage view.

Troubleshooting:
- `npm ci` fails: lockfile mismatch; regenerate package-lock.json and commit
- Docker push fails: verify `dockerhub-creds`
- SSH deploy fails: security group or key mismatch

---

## 7) AWS Deployment (Free Tier Focus)

## 7.1 Cheapest practical choice: EC2 t2.micro/t3.micro

- **EC2** is usually cheaper/flexible for this stack than Elastic Beanstalk.
- Elastic Beanstalk itself is free, but still uses EC2 + can add extra resources by mistake.
- For beginners, one EC2 VM with Docker is simplest and predictable.

Estimated monthly cost (if in free tier limits):
- EC2: $0 (up to free-tier hours)
- EBS (small): near $0 within free tier
- Data transfer: small apps usually low; monitor usage
- MongoDB Atlas M0: $0
- Docker Hub free: $0

Outside free tier: roughly $8-$12/month for smallest EC2 + storage (region dependent).

### 7.2 Launch EC2
1. AWS Console -> EC2 -> Launch Instance
2. AMI: Ubuntu 22.04
3. Instance type: t2.micro/t3.micro
4. Key pair: create/download `.pem`
5. Security group inbound:
   - SSH 22 (your IP only)
   - HTTP 80 (0.0.0.0/0)
   - Custom TCP 5000 (optional, for API direct)
6. Launch

### 7.3 SSH into EC2

```bash
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>
```

### 7.4 Install Docker on EC2

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io
sudo usermod -aG docker ubuntu
newgrp docker
```

Test:

```bash
docker --version
```

### 7.5 MongoDB Atlas setup
1. Create free M0 cluster
2. Create DB user/password
3. Network access: allow EC2 public IP
4. Copy connection string
5. Replace placeholder in `infra/scripts/deploy-ec2.sh`:

```bash
-e MONGODB_URI="mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/url_shortener?retryWrites=true&w=majority"
```

---

## 8) Slack Integration

### 8.1 Create Slack incoming webhook
1. Go to [Slack API Incoming Webhooks](https://api.slack.com/messaging/webhooks)
2. Create app from scratch
3. Enable Incoming Webhooks
4. Add new webhook to workspace channel
5. Copy webhook URL

### 8.2 Add in Jenkins
- Add as secret text or environment variable: `SLACK_WEBHOOK_URL`

### 8.3 Test manually

```bash
curl -X POST -H 'Content-type: application/json' --data '{"text":"Jenkins Slack test"}' <YOUR_WEBHOOK_URL>
```

You should see message in Slack channel.

Screenshot description:
- Slack channel showing "SUCCESS: URL Shortener pipeline #X completed."

---

## 9) Testing the Full Pipeline End-to-End

1. Push code change to GitHub
2. Trigger Jenkins build (manual or webhook)
3. Verify stage view all green
4. Check Docker Hub tags for new images
5. Open EC2 public IP in browser (frontend)
6. Create short URL and test redirect
7. Check stats endpoint clicks increment
8. Confirm Slack success notification

Commands to test deployed app:

```bash
curl -X POST http://<EC2_PUBLIC_IP>:5000/shorten -H "Content-Type: application/json" -d '{"url":"https://example.com"}'
curl http://<EC2_PUBLIC_IP>:5000/stats/<CODE>
```

---

## Production Checklist (Minimal but Strong)

- [ ] Use HTTPS with reverse proxy (Nginx + certbot) when going public
- [ ] Restrict EC2 SSH to your IP only
- [ ] Rotate secrets every 60-90 days
- [ ] Enable MongoDB Atlas alerts and backups
- [ ] Add backend rate limiting (`express-rate-limit`)
- [ ] Add healthcheck monitoring (UptimeRobot free)

---

## Common Errors + Fixes

1. **Jenkins can't run docker**
   - Add Jenkins user to docker group or use docker-in-docker setup.

2. **EC2 deploy script fails with permission denied**
   - Ensure `ec2-ssh-key` uses correct private key and username (`ubuntu`).

3. **Atlas connection timeout**
   - Whitelist EC2 IP in Atlas network settings.

4. **Frontend cannot call backend after deploy**
   - Make sure backend port 5000 is open or place both behind reverse proxy.

---

## Why this architecture is good for beginners

- App remains intentionally simple (3 endpoints, small UI).
- DevOps is realistic and industry-style (build, test, image, deploy, notify).
- You can scale later without rewriting everything.

