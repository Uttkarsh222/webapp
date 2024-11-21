const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const AWS = require('aws-sdk');

// Initialize SNS
const sns = new AWS.SNS({ region: 'us-east-1' }); // Update region if needed
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

const isValidEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

// **Create a New User**
exports.createUser = async (req, res) => {
    try {
        const { email, password, firstName, lastName } = req.body;

        // Validate required fields
        if (!email || !password || !firstName || !lastName) {
            console.log('Missing required fields in request.');
            return res.status(400).json({ message: 'Missing required fields.' });
        }

        // Validate email format
        if (!isValidEmail(email)) {
            console.log('Invalid email format:', email);
            return res.status(400).json({ message: 'Invalid email format.' });
        }

        // Check if the user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            console.log('User already exists with email:', email);
            return res.status(400).json({ message: 'User already exists.' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user with `verified` set to false
        const newUser = await User.create({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            verified: false,
            accountCreated: new Date(),
            accountUpdated: new Date(),
        });

        console.log('New user created:', newUser.id);

        // Generate a verification token
        const verificationToken = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET, { expiresIn: '2m' });

        // Save the verification token to the database
        newUser.verificationToken = verificationToken;
        await newUser.save();

        // Publish a message to SNS for verification email
        const message = JSON.stringify({
            userId: newUser.id,
            email: newUser.email,
            token: verificationToken,
            timestamp: new Date().toISOString(),
        });

        await sns.publish({ Message: message, TopicArn: SNS_TOPIC_ARN }).promise();
        console.log('Verification request sent to SNS for user:', newUser.email);

        // Return user details without sensitive information
        res.status(201).json({
            id: newUser.id,
            email: newUser.email,
            first_name: newUser.firstName,
            last_name: newUser.lastName,
            account_created: newUser.accountCreated,
            account_updated: newUser.accountUpdated,
        });
    } catch (error) {
        console.error('Error in createUser:', error.message);
        res.status(500).json({ message: 'Internal server error.' });
    }
};

// **Verify a User's Email**
exports.verifyUser = async (req, res) => {
    try {
        const { token } = req.query;
        console.log('Received token:', token);

        if (!token) {
            console.log('Token is missing');
            return res.status(400).json({ message: 'Token is required.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded token:', decoded);

        const user = await User.findOne({ where: { id: decoded.userId, verificationToken: token } });
        console.log('Found user:', user);

        if (!user) {
            console.log('Invalid token or user not found.');
            return res.status(404).json({ message: 'Invalid token or user not found.' });
        }

        if (user.verified) {
            console.log('User is already verified.');
            return res.status(400).json({ message: 'User is already verified.' });
        }

        user.verified = true;
        user.verificationToken = null;
        await user.save();

        console.log('User email verified successfully:', user.email);
        return res.status(200).json({ message: 'Email successfully verified.' });
    } catch (error) {
        console.error('Error verifying token:', error.message);

        if (error.name === 'TokenExpiredError') {
            return res.status(400).json({ message: 'Token has expired. Please register again.' });
        }

        return res.status(500).json({ message: 'Internal server error.' });
    }
};


// **Get User Details**
exports.getUser = async (req, res) => {
    console.log('Fetching user details...');
    try {
        const userId = req.user.id;

        // Find the user by ID
        const user = await User.findByPk(userId);
        if (!user) {
            console.log('User not found with ID:', userId);
            return res.status(404).send();
        }

        // Check if user is verified
        if (!user.verified) {
            console.log('User email not verified:', user.email);
            return res.status(403).json({ message: 'Email not verified. Please verify your email to continue.' });
        }

        // Return user details without the password
        res.status(200).json({
            id: user.id,
            email: user.email,
            first_name: user.firstName,
            last_name: user.lastName,
            account_created: user.accountCreated,
            account_updated: user.accountUpdated,
        });
    } catch (error) {
        console.error('Error in getUser:', error);
        res.status(500).send();
    }
};

// **Update User Details**
exports.updateUser = async (req, res) => {
    console.log('Updating user details...');
    try {
        const userId = req.user.id;
        const { firstName, lastName, password, email } = req.body;

        console.log('Request for updating user ID:', userId);

        // Find the user in the database
        const user = await User.findByPk(userId);
        if (!user) {
            console.log('User not found with ID:', userId);
            return res.status(404).send();
        }

        // Check if user is verified
        if (!user.verified) {
            console.log('User email not verified:', user.email);
            return res.status(403).json({ message: 'Email not verified. Please verify your email to continue.' });
        }

        // Prevent updating account_created and account_updated
        if (req.body.accountCreated || req.body.accountUpdated) {
            console.log('Attempt to update account creation or updated dates');
            return res.status(400).send();
        }

        // Prevent email updates if the email is different from the current one
        if (email && email !== user.email) {
            console.log('Attempt to change email denied');
            return res.status(400).send();
        }

        // Only hash and update password if provided
        if (password) {
            user.password = await bcrypt.hash(password, 10);
        }

        // Update first and last names if provided
        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;

        user.accountUpdated = new Date();

        await user.save();
        console.log('User updated successfully:', userId);
        res.status(204).send();
    } catch (error) {
        console.error('Error in updateUser:', error);
        res.status(500).send();
    }
};
