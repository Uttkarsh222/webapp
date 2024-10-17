#!/bin/bash
set -e
set -x  # For debugging; consider removing this in production

echo "Navigating to the app directory..."
cd /home/ubuntu/

echo "Ensuring the webapp directory exists..."
mkdir -p /home/ubuntu/webapp

echo "Copying application files..."
cp -R /home/ubuntu/src /home/ubuntu/webapp/   # Copy the whole src folder, not just its contents
cp /home/ubuntu/package.json /home/ubuntu/webapp/
cp /home/ubuntu/package-lock.json /home/ubuntu/webapp/

# Only copy .env if it exists to avoid errors
if [ -f /home/ubuntu/.env ]; then
    cp /home/ubuntu/.env /home/ubuntu/webapp/
else
    echo ".env file not found, skipping..."
fi

echo "Listing files in webapp directory..."
ls -alh /home/ubuntu/webapp/

echo "Setting correct ownership of the application directory..."
sudo chown -R csye6225:csye6225 /home/ubuntu/webapp
sudo chmod -R 775 /home/ubuntu/webapp

echo "Setting correct ownership of the .npm directory..."
sudo mkdir -p /home/csye6225/.npm
sudo chown -R csye6225:csye6225 /home/csye6225/.npm
sudo chmod -R 755 /home/csye6225/.npm

# Note: Be careful about changing ownership of /home/ubuntu entirely
echo "Setting correct ownership of /home/ubuntu directory..."
sudo chown -R csye6225:csye6225 /home/ubuntu
sudo chmod -R 775 /home/ubuntu

echo "Listing directory permissions for /home/ubuntu and /home/ubuntu/webapp..."
ls -ld /home/ubuntu
ls -ld /home/ubuntu/webapp

echo "Navigating to the application folder and installing dependencies as 'csye6225' user..."
sudo -u csye6225 bash -c 'cd /home/ubuntu/webapp && npm install --unsafe-perm --loglevel=verbose'

echo "Listing files to verify correct copy and ownership..."
ls -alh /home/ubuntu/webapp/

echo "File listing complete. All operations performed successfully."
