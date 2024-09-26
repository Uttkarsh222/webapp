const express = require('express');
const router = express.Router();
const { healthCheck } = require('../controllers/healthController');

router.use((req, res, next) => {
    if (req.method !== 'GET') {
        return res.status(405).send();  // Respond with 405 Method Not Allowed for other methods
    }
    next();
});

// Health Check Endpoint
router.get('/', healthCheck);

module.exports = router;
