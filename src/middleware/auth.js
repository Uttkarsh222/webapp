// src/middleware/auth.js
const User = require('../models/user');
const bcrypt = require('bcrypt');

const authenticate = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('Basic ')) {
        return res.status(400).send();
    }

    const token = authHeader.split(' ')[1]; 
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const [email, password] = decoded.split(':');

    User.findOne({ where: { email } })
        .then((user) => {
            if (!user) {
                return res.status(400).send();
            }
            bcrypt.compare(password, user.password)
                .then((isMatch) => {
                    if (!isMatch) {
                        return res.status(400).send();
                    }
                    req.user = user;
                    next();
                })
                .catch(() => res.status(500).send());
        })
        .catch(() => res.status(500).send());
};

module.exports = authenticate;
