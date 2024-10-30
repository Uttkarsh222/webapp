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

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js not found. Please install Node.js and try again."
    exit 1
else
    echo "Node.js found."
fi

# Create the logs directory (with parent directories if needed) and set permissions
echo "Creating log directory..."
sudo mkdir -p "$LOG_DIR"
sudo chown -R ubuntu:ubuntu "$LOG_DIR"

# Install CloudWatch Agent
echo "Installing CloudWatch Agent..."
sudo apt-get update -y

# Add the Amazon CloudWatch repository and install the agent
sudo wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i amazon-cloudwatch-agent.deb

# Create CloudWatch Agent configuration file directory if missing
echo "Ensuring CloudWatch Agent configuration directory exists..."
sudo mkdir -p /opt/aws/amazon-cloudwatch-agent/etc/
sudo chown -R ubuntu:ubuntu /opt/aws/amazon-cloudwatch-agent/etc/

# Create CloudWatch Agent configuration file for logs and metrics
echo "Creating CloudWatch Agent configuration..."
sudo tee "$CLOUDWATCH_CONFIG" > /dev/null <<'CLOUDWATCH_EOF'
{
  "agent": {
    "logfile": "/opt/aws/amazon-cloudwatch-agent/logs/amazon-cloudwatch-agent.log"
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/home/ubuntu/webapp/src/logs/app.log",
            "log_group_name": "myapp-logs",
            "log_stream_name": "webapp-log-stream",
            "timezone": "Local"
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "MyAppMetrics",
    "metrics_collected": {
      "statsd": {
        "service_address": ":8125",
        "metrics_collection_interval": 60,
        "metrics_aggregation_interval": 300
      }
    }
  }
}
CLOUDWATCH_EOF



# Create CloudWatch Agent systemd service file
echo "Creating CloudWatch Agent systemd service file..."
sudo tee "$CLOUDWATCH_SERVICE_FILE" > /dev/null <<EOF
[Unit]
Description=Amazon CloudWatch Agent
After=network.target

[Service]
ExecStart=/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:$CLOUDWATCH_CONFIG -s
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF


# Create a systemd service file for the Node.js app
echo "Creating a systemd service file for the Node.js app..."
cat <<EOF | sudo tee /etc/systemd/system/webapp.service > /dev/null
[Unit]
Description=Node.js App
After=network.target mysql.service

[Service]
ExecStart=/usr/bin/node /home/ubuntu/webapp/src/app.js
Restart=always          
RestartSec=5               
User=csye6225
Group=csye6225
EnvironmentFile=/home/ubuntu/webapp/.env
WorkingDirectory=/home/ubuntu/webapp
StandardOutput=journal
StandardError=journal
SyslogIdentifier=webapp

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd to recognize the new CloudWatch service file
echo "Reloading systemd to recognize the new CloudWatch Agent service file..."
sudo systemctl daemon-reload


# Enable and start the webapp service
echo "Enabling the webapp service to start on boot..."
sudo systemctl enable webapp.service

echo "Starting the webapp service..."
sudo systemctl start webapp.service

# Check the service status
echo "Checking the service status..."
sudo systemctl status webapp.service --no-pager

# Enable and start the CloudWatch Agent as a systemd service
echo "Enabling and starting the CloudWatch Agent..."
sudo systemctl enable amazon-cloudwatch-agent
sudo systemctl start amazon-cloudwatch-agent

# Start CloudWatch Agent with the custom configuration
echo "Starting CloudWatch Agent with custom configuration..."
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config -m ec2 \
  -c file:"$CLOUDWATCH_CONFIG" -s

# Check logs from the last minute for errors or issues
echo "Checking logs from the last minute for errors or issues..."
sudo journalctl -u webapp.service --since "1 minute ago" --no-pager
