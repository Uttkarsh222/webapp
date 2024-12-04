const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = require('../app');
const User = require('../models/user');
const sequelize = require('../config/dbConfig');

beforeAll(async () => {
    try {
        await sequelize.sync({ force: true });

        const passwordHash = await bcrypt.hash('skdjfhskdfjhg', 10);
        await User.create({
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane.doe@example.com',
            password: passwordHash,
            verified: true,
        });
    } catch (error) {
        console.error('Error in beforeAll:', error.message);
        throw error;
    }
});

afterAll(async () => {
    try {
        await sequelize.close();
    } catch (error) {
        console.error('Error in afterAll:', error.message);
    }
});

describe('User APIs', () => {
    it('GET /v2/user/self - Should return user information', async () => {
        const encodedCredentials = Buffer.from('jane.doe@example.com:skdjfhskdfjhg').toString('base64');

        const response = await request(app)
            .get('/v1/user/self')
            .set('Authorization', `Basic ${encodedCredentials}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(expect.objectContaining({
            id: expect.any(String),
            email: 'jane.doe@example.com',
            first_name: 'Jane',
            last_name: 'Doe',
        }));
    });

    it('PUT /v2/user/self - Should update user information', async () => {
        const encodedCredentials = Buffer.from('jane.doe@example.com:skdjfhskdfjhg').toString('base64');

        const response = await request(app)
            .put('/v2/user/self')
            .set('Authorization', `Basic ${encodedCredentials}`)
            .send({
                firstName: 'Jane Updated',
                lastName: 'Doe Updated',
                password: 'newpassword123',
            });

        expect(response.status).toBe(204);

        const user = await User.findOne({ where: { email: 'jane.doe@example.com' } });
        expect(user.firstName).toBe('Jane Updated');
        expect(user.lastName).toBe('Doe Updated');
        const isPasswordValid = await bcrypt.compare('newpassword123', user.password);
        expect(isPasswordValid).toBe(true);
    });

    it('DELETE /v2/user/self - Should return 405 Method Not Allowed', async () => {
        const encodedCredentials = Buffer.from('jane.doe@example.com:skdjfhskdfjhg').toString('base64');

        const response = await request(app)
            .delete('/v2/user/self')
            .set('Authorization', `Basic ${encodedCredentials}`);

        expect(response.status).toBe(405);
    });
    

    it('GET /v2/user/verify - Should return error for invalid token', async () => {
        const response = await request(app)
            .get('/v2/user/verify?token=INVALID_TOKEN');

        expect(response.status).toBe(500); // Adjust the status code based on your implementation
    });

    it('GET /v2/user/verify - Should return error for expired token', async () => {
        const user = await User.findOne({ where: { email: 'jane.doe@example.com' } });

        const expiredToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '-1s' });

        const response = await request(app)
            .get(`/v2/user/verify?token=${expiredToken}`);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Token has expired. Please register again.');
    });
});
