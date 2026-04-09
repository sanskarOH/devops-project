#!/usr/bin/env bash
set -euo pipefail

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not installed on EC2."
  exit 1
fi

: "${DOCKERHUB_USERNAME:?DOCKERHUB_USERNAME is required}"
: "${BUILD_NUMBER:?BUILD_NUMBER is required}"

BACKEND_IMAGE="${DOCKERHUB_USERNAME}/url-shortener-backend:latest"
FRONTEND_IMAGE="${DOCKERHUB_USERNAME}/url-shortener-frontend:latest"

sudo docker pull "$BACKEND_IMAGE"
sudo docker pull "$FRONTEND_IMAGE"

sudo docker network create urlshortener-net || true

sudo docker rm -f urlshortener-backend urlshortener-frontend || true

sudo docker run -d --name urlshortener-backend --network urlshortener-net -p 5000:5000 \
  --restart unless-stopped \
  -e PORT=5000 \
  -e BASE_URL=http://<EC2_PUBLIC_IP>:5000 \
  -e MONGODB_URI="<PUT_YOUR_ATLAS_CONNECTION_STRING_HERE>" \
  "$BACKEND_IMAGE"

sudo docker run -d --name urlshortener-frontend --network urlshortener-net -p 80:80 \
  --restart unless-stopped \
  "$FRONTEND_IMAGE"

echo "Deployment completed"
