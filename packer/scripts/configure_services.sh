
set -e
set -x


if ! command -v node &> /dev/null; then
    echo "Node.js not found. Please install Node.js and try again."
    exit 1
else
    echo "Node.js found."
fi


if ! systemctl is-active --quiet mysql; then
    echo "MySQL service is not running. Starting MySQL..."
    sudo systemctl start mysql
    sudo systemctl enable mysql
else
    echo "MySQL service is already running."
fi


echo "Creating a systemd service file for the Node.js app..."
cat <<EOF | sudo tee /etc/systemd/system/webapp.service > /dev/null
[Unit]
Description=Node.js App
After=network.target mysql.service

[Service]
ExecStart=/usr/bin/node /home/ubuntu/webapp/src/app.js
Restart=on-failure          
RestartSec=5               
User=csye6225
Group=csye6225
EnvironmentFile=/home/ubuntu/.env
WorkingDirectory=/home/ubuntu/webapp
StandardOutput=journal
StandardError=journal
SyslogIdentifier=webapp

[Install]
WantedBy=multi-user.target
EOF


echo "Reloading systemd to recognize the new service file..."
sudo systemctl daemon-reload


echo "Enabling the webapp service to start on boot..."
sudo systemctl enable webapp.service


echo "Starting the webapp service..."
sudo systemctl start webapp.service


echo "Checking the service status..."
sudo systemctl status webapp.service --no-pager


echo "Checking logs from the last minute for errors or issues..."
sudo journalctl -u webapp.service --since "1 minute ago" --no-pager

