require('dotenv').config();
const { Sequelize } = require('sequelize');

console.log(process.env.DATABASE_NAME + " " + process.env.DATABASE_USER + " " + process.env.DATABASE_PASSWORD + " " + process.env.DATABASE_HOST + " " + process.env.DATABASE_DIALECT);
// Initialize a Sequelize instance with your new database credentials
const sequelize = new Sequelize(process.env.DATABASE_NAME, process.env.DATABASE_USER, process.env.DATABASE_PASSWORD, {
  host: process.env.DATABASE_HOST,
  dialect: process.env.DATABASE_DIALECT,
  
});

module.exports = sequelize;
