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

sudo mkdir ~/webapp
sudo unzip /tmp/webapp.zip -d ~/webapp
cd ~/webapp 
sudo npm i

echo "DB_HOSTNAME=$DB_HOSTNAME" | sudo tee -a .env >/dev/null
echo "DB_USER=$DB_USER" | sudo tee -a .env >/dev/null
echo "DB_PASSWORD=$DB_PASSWORD" | sudo tee -a .env >/dev/null
echo "DB_NAME=$DB_NAME" | sudo tee -a .env >/dev/null

sudo npm install -g pm2
pm2 start index.js
pm2 save
pm2 startup | sudo bash

sudo apt-get clean