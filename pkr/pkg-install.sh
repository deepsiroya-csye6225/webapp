#!/bin/bash

set -e

sudo apt update -y
sudo apt upgrade -y

curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

sudo apt install -y unzip

sudo mkdir /opt/webapp
sudo unzip /tmp/webapp.zip -d /opt/webapp
cd /opt/webapp 

sudo groupadd csye6225
sudo useradd -s /bin/false -g csye6225 -d /opt/webapp -m csye6225

sudo chown -R csye6225:csye6225 /opt/webapp
sudo chown -R csye6225:csye6225 /etc/environment
sudo chmod -R 755 /opt/webapp

sudo -u csye6225 npm i

sudo mv /tmp/node-app.service /lib/systemd/system/

sudo systemctl daemon-reload
sudo systemctl start node-app
sudo systemctl enable node-app

sudo wget https://s3.amazonaws.com/amazoncloudwatch-agent/debian/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i amazon-cloudwatch-agent.deb || sudo apt-get install -y -f

sudo mv /tmp/amazon-cloudwatch-agent.json /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
sudo chown csye6225:csye6225 /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
sudo chmod 755 /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

sudo systemctl enable amazon-cloudwatch-agent.service
sudo systemctl start amazon-cloudwatch-agent.service