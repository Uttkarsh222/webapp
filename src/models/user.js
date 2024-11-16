const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/dbConfig');

class User extends Model {}

User.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    firstName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    accountCreated: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    accountUpdated: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false, 
    },
    verificationToken: {
        type: DataTypes.STRING, // Store the JWT token
        allowNull: true,
    },
}, {
    sequelize,
    modelName: 'User',
});

module.exports = User;
