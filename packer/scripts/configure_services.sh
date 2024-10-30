#!/bin/bash

# Exit immediately if any command fails and print commands
set -e
set -x

# Variables
LOG_DIR="/home/ubuntu/webapp/src/logs/"
NODE_PATH="/usr/bin/node"
SERVICE_FILE="/etc/systemd/system/webapp.service"
ENV_FILE="/home/ubuntu/webapp/.env"
CLOUDWATCH_CONFIG="/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json"
CLOUDWATCH_SERVICE_FILE="/etc/systemd/system/amazon-cloudwatch-agent.service"

# Step 1: Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js not found. Please install Node.js and try again."
    exit 1
else
    echo "Node.js found."
fi

# Step 2: Create the logs directory and set permissions
echo "Creating log directory..."
sudo mkdir -p "$LOG_DIR"
sudo chown -R ubuntu:ubuntu "$LOG_DIR"

# Step 3: Install CloudWatch Agent
echo "Installing CloudWatch Agent..."
sudo apt-get update -y

# Add the Amazon CloudWatch repository and install the agent
sudo wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i amazon-cloudwatch-agent.deb

# Step 4: Ensure CloudWatch Agent configuration directory exists with correct permissions
echo "Ensuring CloudWatch Agent configuration directory exists..."
sudo mkdir -p /opt/aws/amazon-cloudwatch-agent/etc/
sudo chown -R root:root /opt/aws/amazon-cloudwatch-agent/etc/

# Step 5: Create CloudWatch Agent configuration file for logs and metrics using 'cat'
echo "Creating CloudWatch Agent configuration..."
sudo bash -c 'cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json' <<'CLOUDWATCH_EOF'
{
  "agent": {
      "metrics_collection_interval": 10,
      "logfile": "/var/logs/amazon-cloudwatch-agent.log"
  },
  "logs": {
      "logs_collected": {
          "files": {
              "collect_list": [
                  {
                      "file_path": "/home/ubuntu/webapp/src/logs/app.log",
                      "log_group_name": "csye6225",
                      "log_stream_name": "webapp"
                  }
              ]
          }
      },
      "log_stream_name": "cloudwatch_log_stream"
  },
  "metrics":{
    "metrics_collected":{
       "statsd":{
          "service_address":":8125",
          "metrics_collection_interval":15,
          "metrics_aggregation_interval":300
       }
    }
 }
}

CLOUDWATCH_EOF

# Verify if the configuration file was created successfully
if [ -f "$CLOUDWATCH_CONFIG" ]; then
    echo "CloudWatch Agent JSON configuration file created successfully."
else
    echo "Failed to create CloudWatch Agent JSON configuration file."
    exit 1
fi


# Step 7: Create a systemd service file for the Node.js app
echo "Creating a systemd service file for the Node.js app..."
sudo bash -c 'cat > /etc/systemd/system/webapp.service' <<EOF
[Unit]
Description=Node.js App
After=network.target mysql.service

[Service]
ExecStart=$NODE_PATH /home/ubuntu/webapp/src/app.js
Restart=always          
RestartSec=5               
User=csye6225
Group=csye6225
EnvironmentFile=$ENV_FILE
WorkingDirectory=/home/ubuntu/webapp
StandardOutput=journal
StandardError=journal
SyslogIdentifier=webapp

[Install]
WantedBy=multi-user.target
EOF

# Step 8: Reload systemd to recognize the new service files
echo "Reloading systemd to recognize the new CloudWatch Agent and webapp service files..."
sudo systemctl daemon-reload

# Step 9: Enable the webapp service to start on boot and start the service
echo "Enabling the webapp service to start on boot..."
sudo systemctl enable webapp.service
echo "Starting the webapp service..."
sudo systemctl start webapp.service

# # Step 10: Enable and start the CloudWatch Agent as a systemd service
# echo "Enabling and starting the CloudWatch Agent..."
# sudo systemctl enable amazon-cloudwatch-agent
# sudo systemctl start amazon-cloudwatch-agent

# # Step 11: Start CloudWatch Agent with the custom configuration
# echo "Starting CloudWatch Agent with custom configuration..."
# sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:"$CLOUDWATCH_CONFIG" -s

# Step 12: Check webapp service logs from the last minute for errors or issues
echo "Checking webapp service logs from the last minute for errors or issues..."
sudo journalctl -u webapp.service --since "1 minute ago" --no-pager

# Step 13: Check CloudWatch Agent service logs from the last minute for errors or issues
echo "Checking CloudWatch Agent service logs from the last minute for errors or issues..."
sudo journalctl -u amazon-cloudwatch-agent --since "1 minute ago" --no-pager
