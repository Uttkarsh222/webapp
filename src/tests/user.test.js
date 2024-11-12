const request = require('supertest');
const app = require('../app'); // Your Express app
const User = require('../models/user'); // Your user model, adjust the path if necessary

describe('User APIs', () => {
  let newUser = {
    email: 'jane.doe@example.com',
    first_name: 'Jane',
    last_name: 'Doe',
    password: 'password123',
  };

  it('Should create a new user', async () => {
    const response = await request(app)
      .post('/v1/user')
      .send(newUser);

    // Validate that the response has a status code of 201
    expect(response.status).toBe(201);

    // Validate the structure of the response object, adjusting the id validation
    expect(response.body).toEqual(expect.objectContaining({
      email: 'jane.doe@example.com',
      first_name: 'Jane',
      last_name: 'Doe',
      account_created: expect.any(String),
      account_updated: expect.any(String),
      id: expect.any(String), // Allowing the id to be any string (UUID)
    }));

    // Optionally, validate that the user was actually created in the database
    const createdUser = await User.findById(response.body.id);
    expect(createdUser).not.toBeNull();
    expect(createdUser.email).toBe(newUser.email);
    expect(createdUser.first_name).toBe(newUser.first_name);
    expect(createdUser.last_name).toBe(newUser.last_name);
  });
});
