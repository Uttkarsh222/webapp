const sequelize = require('../config/dbConfig');
const { logger, statsDClient } = require('../logger'); // Import centralized logger and metrics

const healthCheck = async (req, res) => {
    logger.info('Initiating health check...');
    statsDClient.increment('healthcheck.attempt');

    if (Object.keys(req.query).length > 0 || 
        Object.keys(req.body).length > 0 || 
        parseInt(req.headers['content-length'] || 0) > 0) {
        
        logger.warn('Invalid health check request - additional data detected');
        return res.status(400).set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }).send();  
    }

    try {
        const start = Date.now();
        await sequelize.authenticate();
        const duration = Date.now() - start;
        statsDClient.timing('healthcheck.database.connection.duration', duration);
        
        logger.info('Database connection successful');
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }).status(200).send();  // Send an empty 200 OK
    } catch (error) {
        logger.error('Unable to connect to the database:', error);
        statsDClient.increment('healthcheck.database.connection.fail');
        
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }).status(503).send();  // Send an empty 503 
    }
};

module.exports = { healthCheck };
