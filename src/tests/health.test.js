const request = require('supertest');
const app = require('../app'); // Ensure this is the correct path to your app.js
const sequelize = require('../config/dbConfig'); // Ensure this path is correct

beforeAll(async () => {
    await sequelize.sync({ force: true }); // Sync the database
});

describe('Health Check API', () => {
    it('GET /healthz - Should return 200 OK when healthy', async () => {
        const response = await request(app).get('/healthz');
        expect(response.status).toBe(200);
    });

    it('POST /healthz - Should return 405 Method Not Allowed', async () => {
        const response = await request(app).post('/healthz');
        expect(response.status).toBe(405);
    });

    it('PUT /healthz - Should return 405 Method Not Allowed', async () => {
        const response = await request(app).put('/healthz');
        expect(response.status).toBe(405);
    });

    it('DELETE /healthz - Should return 405 Method Not Allowed', async () => {
        const response = await request(app).delete('/healthz');
        expect(response.status).toBe(405);
    });
});
