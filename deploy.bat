@echo off
echo Deploying to server...
ssh -i orbit.pem ubuntu@3.26.1.132 "cd Orbit-Activity-Marketplace-BE && git pull && npm install && npx prisma generate && npm run build && pm2 restart orbit-api"
echo Deployment complete!
pause