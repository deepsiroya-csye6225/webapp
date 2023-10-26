#!/bin/bash

sudo apt update -y
sudo apt upgrade -y

curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs 

sudo apt install -y unzip

sudo mkdir /opt/webapp
sudo unzip /tmp/webapp.zip -d /opt/webapp
cd /opt/webapp 

sudo npm i

sudo mv /tmp/node-app.service /lib/systemd/system/node-app.service 

sudo groupadd csye6225
sudo useradd -s /bin/false -g csye6225 -d /opt/webapp csye6225
sudo chown -R csye6225:csye6225 /opt/webapp
sudo chown -R csye6225:csye6225 /etc/environment
sudo chmod -R 755 /opt/webapp

sudo systemctl daemon-reload
sudo systemctl enable node-app.service
sudo systemctl start node-app.service

