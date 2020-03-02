# yarn build
# scp -r ./dist/* root@60.205.179.88:/webdata/questionnaire_system/client

tar --exclude="./node_modules" --exclude="./logs" --exclude="./typings" --exclude="./run" --exclude="./package-lock.json"  -cvzf  server.tar.gz ./
scp server.tar.gz root@60.205.179.88:/webdata/questionnaire_system/server/server.tar.gz
ssh root@60.205.179.88 "cd /webdata/questionnaire_system/server;tar -xvzf server.tar.gz;rm -f server.tar.gz;npm i;npm run stop;npm start;"
rm server.tar.gz