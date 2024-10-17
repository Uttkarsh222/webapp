// src/app.js
const express = require('express');
const healthRoutes = require('./routes/healthRoutes');
const userRoutes = require('./routes/userRoutes');
const sequelize = require('./config/dbConfig');

require('dotenv').config();

const app = express();
app.use(express.json());  // JSON parsing middleware
const PORT = process.env.PORT || 3000;

process.on('uncaughtException', (error) => {
    console.error(`Uncaught Exception: ${error.message}`);
    console.error(error.stack);
    process.exit(1); // Exit the process after logging the uncaught exception
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Application specific logging, throwing an error, or other logic here
});

// Route for health checks
app.use('/healthz', healthRoutes);

// Routes for user operations
app.use('/v1', userRoutes);

// Catch-all for unsupported routes
app.use('*', (req, res) => {
    res.status(404).send('Resource not found');  // Respond with 404 Not Found for undefined routes
});

// Sync the database and start the server if not in test environment
if (process.env.NODE_ENV !== 'test') {
    sequelize.sync()
        .then(() => {
            console.log('Database & tables created!');
            app.listen(PORT, () => {
                console.log(`Server running on http://localhost:${PORT}`);
            });
        })
        .catch(err => {
            console.error('Failed to sync database:', err);
            process.exit(1); // Exit if the database cannot connect, ensuring Docker or Kubernetes can restart the service if needed
        });
}

// Export `app` for testing purposes
module.exports = app;
