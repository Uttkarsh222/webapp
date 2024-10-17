require('dotenv').config();
const { Sequelize } = require('sequelize');

// Log an attempt to connect to the database without revealing sensitive details
console.log(`Attempting to connect to the database at ${process.env.DATABASE_HOST} using ${process.env.DATABASE_DIALECT} dialect.`);

// Initialize a Sequelize instance with your database credentials
const sequelize = new Sequelize(process.env.DATABASE_NAME, process.env.DATABASE_USER, process.env.DATABASE_PASSWORD, {
  host: process.env.DATABASE_HOST,
  dialect: process.env.DATABASE_DIALECT,
  logging: console.log,  // Enables detailed SQL logging, consider restricting this in production
});

module.exports = sequelize;
