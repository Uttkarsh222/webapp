const bcrypt = require('bcrypt');
const User = require('../models/user');

const isValidEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

exports.createUser = async (req, res) => {
    try {
        const { email, password, firstName, lastName } = req.body;

        // Log the incoming request body
        console.log('Request Body:', req.body);

        // Check for empty fields
        if (!firstName || !lastName || !password) {
            console.log('Missing fields in request');
            return res.status(400).send();
        }

        // Validate email format
        if (!isValidEmail(email)) {
            console.log('Invalid email format:', email);
            return res.status(400).send();
        }

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            console.log('User already exists with email:', email);
            return res.status(400).send();
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = await User.create({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            accountCreated: new Date(),
            accountUpdated: new Date(),
        });

        console.log('New user created:', newUser.id);

        // Return user details with ID and without password
        res.status(201).json({
            id: newUser.id, 
            email: newUser.email,
            first_name: newUser.firstName,
            last_name: newUser.lastName,
            account_created: newUser.accountCreated,
            account_updated: newUser.accountUpdated,
        });
    } catch (error) {
        console.error('Error in createUser:', error);
        res.status(500).send();
    }
};




exports.getUser = async (req, res) => {
    console.log('Fetching user details...');
    try {
        const userId = req.user.id; // Assuming user ID is retrieved from authentication middleware
        console.log('User ID:', userId);
        // Find the user by ID
        const user = await User.findByPk(userId);
        if (!user) {
            console.log('User not found with ID:', userId);
            return res.status(404).send(); // User not found
        }

        // Return user details including ID without the password
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



exports.updateUser = async (req, res) => {
    console.log('Updating user details...');
    try {
        const userId = req.user.id; // Get user ID from the request
        const { firstName, lastName, password, email } = req.body; // Extract first name, last name, password, and email

        console.log('Request for updating user ID:', userId);
        // Find the user in the database
        const user = await User.findByPk(userId);
        if (!user) {
            console.log('User not found with ID:', userId);
            return res.status(404).send(); // User not found
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
            user.password = await bcrypt.hash(password, 10); // Hash password before saving
        }

        // Update first and last names if provided
        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;

        user.accountUpdated = new Date(); // Update the accountUpdated field

        await user.save(); // Save the updated user details
        console.log('User updated successfully:', userId);
        res.status(204).send(); // No content response
    } catch (error) {
        console.error('Error in updateUser:', error);
        res.status(500).send(); // Internal server error
    }
};
