require('dotenv').config();
const { Sequelize } = require('sequelize');

console.log(`Connecting to database ${process.env.DATABASE_NAME} using ${process.env.DATABASE_DIALECT} dialect at host ${process.env.DATABASE_HOST}.`);

// Initialize a Sequelize instance with your new database credentials
const sequelize = new Sequelize(process.env.DATABASE_NAME, process.env.DATABASE_USER, process.env.DATABASE_PASSWORD, {
  host: process.env.DATABASE_HOST,
  dialect: process.env.DATABASE_DIALECT,
  
});

module.exports = sequelize;