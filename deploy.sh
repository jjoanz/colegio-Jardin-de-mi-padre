#!/bin/bash
set -e
cd /var/www/colegio-platform

echo "==> git pull"
git pull origin main

echo "==> npm install"
npm install

echo "==> prisma migrate deploy"
npx prisma migrate deploy

echo "==> npm run build"
npm run build

echo "==> pm2 restart"
pm2 restart colegio-platform --update-env

echo "==> Listo."
