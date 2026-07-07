#!/bin/bash
# -------------------------------------------------------------
# BackOne Deep Package Inspection - Secure Deployment Script
# -------------------------------------------------------------

echo "🚀 Starting deployment to demoplace..."

# Pull latest changes from master
git pull origin master

# Ensure .env.production exists
if [ ! -f .env.production ]; then
  echo "⚠️  .env.production is missing! Please create it based on .env.production.example"
  exit 1
fi

# Build and deploy the production docker compose configuration
echo "🐳 Building and starting Docker containers in detached mode..."
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d --remove-orphans

echo "🧹 Cleaning up unused Docker images..."
docker image prune -f

echo "✅ Deployment successful!"
echo "Your BackOne Dashboard is now securely running behind NGINX."
echo "Only NGINX is exposed to the public. Internal API and MongoDB ports are completely isolated."
