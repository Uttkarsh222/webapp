// src/middleware/auth.js
const User = require('../models/user');
const bcrypt = require('bcrypt');

const authenticate = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('Basic ')) {
        console.log('No or incorrect authorization header format');
        return res.status(400).send();
    }

    const token = authHeader.split(' ')[1]; 
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const [email, password] = decoded.split(':');

    console.log(`Attempting to authenticate user with email: ${email}`);

    User.findOne({ where: { email } })
        .then((user) => {
            if (!user) {
                console.log(`No user found with email: ${email}`);
                return res.status(400).send();
            }
            bcrypt.compare(password, user.password)
                .then((isMatch) => {
                    if (!isMatch) {
                        console.log('Password does not match for user:', email);
                        return res.status(400).send();
                    }
                    console.log('User authenticated successfully:', email);
                    req.user = user;
                    next();
                })
                .catch(() => res.status(500).send());
        })
        .catch(() => res.status(500).send());
};

module.exports = authenticate;
