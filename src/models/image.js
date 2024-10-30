const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/dbConfig'); // Adjust based on your configuration
const User = require('./user');

class Image extends Model {}

Image.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  uploadDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  }
}, {
  sequelize,
  modelName: 'Image',
  timestamps: false
});

User.hasMany(Image, { foreignKey: 'userId', onDelete: 'CASCADE' });
Image.belongsTo(User, { foreignKey: 'userId' });

module.exports = Image;
