#!/bin/bash

# Load environment variables from the .env file
if [ -f .env ]; then
  export $(cat .env | xargs)
fi

sudo apt update -y
sudo apt upgrade -y

sudo apt install nodejs npm -y

sudo apt install mariadb-server -y
sudo mysql_secure_installation
sudo mariadb

echo "create user '${DB_USER}'@'localhost' identified by '${DB_PASSWORD}';" | sudo mariadb
echo "flush privileges;" | sudo mariadb
echo "grant all on . to '${DB_USER}'@'localhost' with grant option;" | sudo mariadb
echo "flush privileges;" | sudo mariadb
echo "create database '${DB_NAME}';" | sudo mariadb
quit

sudo apt install -y unzip 

mkdir ~/webapp
unzip webapp.zip -d ~/webapp
cd ~/webapp && npm i 



sudo apt-get clean