const express = require('express');
const healthRoutes = require('./routes/healthRoutes');
const userRoutes = require('./routes/userRoutes');
const imageRoutes = require('./routes/imageRoutes');
const sequelize = require('./config/dbConfig');
const User = require('./models/user'); // Import the User model
const { logger, statsDClient } = require('./logger'); // Import centralized logger and metrics
require('dotenv').config();

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

// Middleware for logging and metrics
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logMessage = `${req.method} ${req.url} ${res.statusCode} - ${duration}ms`;
        logger.info(logMessage);

        statsDClient.increment(`api.calls.${req.method}.${req.path}`);
        statsDClient.timing(`api.duration.${req.method}.${req.path}`, duration);
    });
    next();
});

// Middleware for logging and timing database queries
sequelize.addHook('afterQuery', (options) => {
    const queryTime = options.benchmark || 0;
    statsDClient.timing('database.query.duration', queryTime);
    logger.info(`Database query executed in ${queryTime}ms`);
});

// Routes
app.use('/healthz', healthRoutes);
app.use('/v1/user/self', imageRoutes);
app.use('/v1', userRoutes);

app.use('*', (req, res) => {
    res.status(405).send();
});

if (process.env.NODE_ENV !== 'test') {
    // Sync the specific User model with `alter: true` to update the table schema
    User.sync({ alter: true })
        .then(() => console.log("Database synchronized with Users table"))
        .catch((error) => console.error("Error synchronizing Users table:", error));

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
