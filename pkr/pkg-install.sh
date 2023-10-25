#!/bin/bash

# Load environment variables from the .env file
if [ -f .env ]; then
  export $(cat .env | xargs)
fi

sudo apt update -y
sudo apt upgrade -y

curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs 

sudo apt install mariadb-server -y
sudo systemctl start mariadb

sudo mysql -u root <<-EOF
SET PASSWORD FOR 'root'@'localhost' = PASSWORD('$DB_PASSWORD');
FLUSH PRIVILEGES;
EOF

mysql -u root -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;"

sudo apt install -y unzip

sudo mkdir /opt/webapp
sudo unzip /tmp/webapp.zip -d /opt/webapp
cd /opt/webapp 


echo "DB_HOSTNAME=$DB_HOSTNAME" | sudo tee -a .env >/dev/null
echo "DB_USER=$DB_USER" | sudo tee -a .env >/dev/null
echo "DB_PASSWORD=$DB_PASSWORD" | sudo tee -a .env >/dev/null
echo "DB_NAME=$DB_NAME" | sudo tee -a .env >/dev/null

sudo npm i

sudo mv /tmp/node-app.service /lib/systemd/system/node-app.service 
sudo systemctl enable node-app.service
sudo systemctl start node-app.service

sudo apt-get clean