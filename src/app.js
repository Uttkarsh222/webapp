// src/app.js
const express = require('express');
const healthRoutes = require('./routes/healthRoutes');
const userRoutes = require('./routes/userRoutes');
const sequelize = require('./config/dbConfig');

require('dotenv').config();

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

// Middleware for parsing JSON request bodies
app.use(express.json());

// Route for health checks
app.use('/healthz', healthRoutes);

// Routes for user operations
app.use('/v1', userRoutes);

// Catch-all for unsupported routes
app.use('*', (req, res) => {
    res.status(405).send();  // Respond with 404 Not Found for undefined routes
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
        });
}

// Export `app` for testing purposes
module.exports = app;