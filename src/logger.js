const winston = require('winston');
const StatsD = require('hot-shots');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logDirectory = path.join(__dirname, 'logs');
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory);
}

// Configure winston logger
const logger = winston.createLogger({
    level: 'info',
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        }),
        new winston.transports.File({ 
            filename: path.join(logDirectory, 'app.log'), 
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            flags: 'a' 
        })
    ]
});

// Initialize StatsD client
const statsDClient = new StatsD({
    host: process.env.STATSD_HOST || 'localhost',
    port: process.env.STATSD_PORT || 8125,
    prefix: 'myapp.',
    errorHandler: (error) => console.error('StatsD error:', error)
});

module.exports = { logger, statsDClient };
