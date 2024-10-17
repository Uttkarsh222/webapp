#!/bin/bash
set -e

echo "Updating package index..."

sudo apt-get update


ls -la /home/ubuntu/.env
cat /home/ubuntu/.env


echo "Installing Node.js 18.x and npm..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "Fixing potential broken packages..."
sudo apt-get install -y build-essential
sudo apt-get install -f -y

echo "Verifying installations..."
node -v
npm -v

echo "Installing MySQL Server..."
sudo apt-get install -y mysql-server

echo "Running MySQL secure installation..."
sudo mysql_secure_installation <<EOF
n
y
y
y
y
EOF

echo "Starting and enabling MySQL service..."
sudo systemctl start mysql
sudo systemctl enable mysql

echo "Checking if MySQL service is running..."
sudo systemctl status mysql | grep "active (running)"


# Load environment variables from .env file
if [[ -f /home/ubuntu/.env ]]; then
    export $(grep -v '^#' /home/ubuntu/.env | xargs)
else
    echo "Error: .env file not found."
    exit 1
fi

echo "Creating MySQL database and user..."
sudo mysql -u root <<EOF
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '$DATABASE_PASSWORD';
FLUSH PRIVILEGES;
CREATE DATABASE IF NOT EXISTS $DATABASE_NAME;
GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' WITH GRANT OPTION;
EOF

echo "Verifying database creation..."
sudo mysql -e "SHOW DATABASES;" | grep "${DATABASE_NAME}"

echo "Verifying user creation..."
sudo mysql -e "SELECT User FROM mysql.user;" | grep "${DATABASE_USER}"

echo "Creating the non-login user 'csye6225'..."
sudo groupadd -f csye6225
sudo useradd -r -s /usr/sbin/nologin -g csye6225 csye6225
