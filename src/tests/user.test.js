const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../app'); // Ensure this is the correct path to your app.js
const User = require('../models/user'); // Ensure this path is correct
const sequelize = require('../config/dbConfig'); // Ensure this path is correct

beforeAll(async () => {
    await sequelize.sync({ force: true }); // Reset database before tests

    // Create a user and ensure they are marked as verified for testing
    const passwordHash = await bcrypt.hash('skdjfhskdfjhg', 10);
    await User.create({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        password: passwordHash,
        verified: true, // Ensure the user is verified
    });
});

describe('User APIs', () => {
    it('GET /v1/user/self - Should return user information', async () => {
        const encodedCredentials = Buffer.from('jane.doe@example.com:skdjfhskdfjhg').toString('base64');

        const response = await request(app)
            .get('/v1/user/self')
            .set('Authorization', `Basic ${encodedCredentials}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(expect.objectContaining({
            id: expect.any(String), // Expecting the id to be a string (UUID)
            email: 'jane.doe@example.com',
            first_name: 'Jane',
            last_name: 'Doe'
        }));
    });

    it('PUT /v1/user/self - Should update user information', async () => {
        const encodedCredentials = Buffer.from('jane.doe@example.com:skdjfhskdfjhg').toString('base64');

        const response = await request(app)
            .put('/v1/user/self')
            .set('Authorization', `Basic ${encodedCredentials}`)
            .send({
                firstName: 'Jane Updated',
                lastName: 'Doe Updated',
                password: 'newpassword123',
                email: 'jane.doe@example.com' // Email included but not updated
            });

        expect(response.status).toBe(204);
    });

    it('DELETE /v1/user/self - Should return 405 Method Not Allowed', async () => {
        const encodedCredentials = Buffer.from('jane.doe@example.com:skdjfhskdfjhg').toString('base64');

        const response = await request(app)
            .delete('/v1/user/self')
            .set('Authorization', `Basic ${encodedCredentials}`);

        expect(response.status).toBe(405);
    });

    it('POST /v1/user - Password should be hashed', async () => {
        const response = await request(app)
            .post('/v1/user')
            .send({
                firstName: 'John',
                lastName: 'Smith',
                email: 'john.smith@example.com',
                password: 'password123'
            });

        const user = await User.findOne({ where: { email: 'john.smith@example.com' } });

        expect(user).not.toBeNull();
        const isPasswordValid = await bcrypt.compare('password123', user.password);
        expect(isPasswordValid).toBe(true);
    });

    it('POST /v1/user - Should not allow non-email usernames', async () => {
        const response = await request(app)
            .post('/v1/user')
            .send({
                firstName: 'Invalid',
                lastName: 'User',
                email: 'invalid_username', // Invalid email format
                password: 'password123'
            });

        expect(response.status).toBe(400); // Adjust based on your validation logic
    });

    it('POST /v1/user - Should not allow duplicate account creation', async () => {
        // First account creation
        await request(app)
            .post('/v1/user')
            .send({
                firstName: 'Jane',
                lastName: 'Doe',
                email: 'jane.doe@example.com',
                password: 'password123'
            });
    
        // Attempt to create a second account with the same email
        const response = await request(app)
            .post('/v1/user')
            .send({
                firstName: 'Jane',
                lastName: 'Doe',
                email: 'jane.doe@example.com', // Duplicate email
                password: 'password456'
            });
    
        expect(response.status).toBe(400); // Expect a bad request for duplicate email
    });
});
