const sequelize = require('../config/dbConfig');

const healthCheck = async (req, res) => {

    // Check for any query parameters, body content, or content-length header
    if (Object.keys(req.query).length > 0 || 
        Object.keys(req.body).length > 0 || 
        parseInt(req.headers['content-length']) > 0) {
        
        return res.status(400).set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }).send();  
    }

    try {
        await sequelize.authenticate();
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }).status(200).send();  // Send an empty 200 OK
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }).status(503).send();  // Send an empty 503 
    }
};



module.exports = { healthCheck };
