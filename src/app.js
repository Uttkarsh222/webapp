const express = require('express');
const healthRoutes = require('./routes/healthRoutes');
const userRoutes = require('./routes/userRoutes');
const imageRoutes = require('./routes/imageRoutes');
const sequelize = require('./config/dbConfig');
const StatsD = require('hot-shots');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

// Initialize StatsD client for metrics
const statsDClient = new StatsD({
    host: process.env.STATSD_HOST || 'localhost',
    port: process.env.STATSD_PORT || 8125,
    prefix: 'myapp.',
    errorHandler: (error) => console.error('StatsD error:', error)
});

// File-based logging setup (logs/app.log)
const logStream = fs.createWriteStream(path.join(__dirname, 'logs', 'app.log'), { flags: 'a' });
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logMessage = `${new Date().toISOString()} ${req.method} ${req.url} ${res.statusCode} - ${duration}ms\n`;
        logStream.write(logMessage);

        // Metrics for API calls
        statsDClient.increment(`api.calls.${req.method}.${req.path}`);
        statsDClient.timing(`api.duration.${req.method}.${req.path}`, duration);
    });
    next();
});

// Middleware for logging and timing database queries
sequelize.addHook('afterQuery', (options) => {
    const queryTime = options.benchmark || 0;
    statsDClient.timing('database.query.duration', queryTime);
    logStream.write(`${new Date().toISOString()} Database query executed in ${queryTime}ms\n`);
});

// Route to simulate S3 interaction with timing
app.get('/s3/example', async (req, res) => {
    const start = Date.now();
    try {
        // Simulate S3 call
        // await s3Client.someOperation(...);
        const duration = Date.now() - start;
        statsDClient.timing('s3.call.duration', duration);
        logStream.write(`${new Date().toISOString()} S3 call duration: ${duration}ms\n`);
        res.sendStatus(200);
    } catch (error) {
        const duration = Date.now() - start;
        logStream.write(`${new Date().toISOString()} S3 call failed - ${error.message} - Duration: ${duration}ms\n`);
        statsDClient.increment('s3.call.fail');
        res.status(500).send('S3 call failed');
    }
});

// Health check and user routes
app.use('/healthz', healthRoutes);
app.use('/v1/user/self', imageRoutes);
app.use('/v1', userRoutes);

app.use('*', (req, res) => {
    res.status(405).send();
});

// Start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
    sequelize.sync()
        .then(() => {
            console.log('Database & tables created!');
            app.listen(PORT, () => {
                console.log(`Server running on http://localhost:${PORT}`);
                statsDClient.increment('server.start');
            });
        })
        .catch(err => {
            console.error('Failed to sync database:', err);
            statsDClient.increment('database.sync.fail');
        });
}

module.exports = app;
