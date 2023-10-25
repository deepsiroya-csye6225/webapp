#!/bin/bash

# Load environment variables from the .env file
if [ -f .env ]; then
  export $(cat .env | xargs)
fi

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
sudo systemctl daemon-reload
sudo systemctl enable node-app.service
sudo systemctl start node-app.service

sudo apt-get clean