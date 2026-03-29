import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const TypeRequirement = sequelize.define('TypeRequirement', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(120),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive'),
    defaultValue: 'Active',
  },
}, {
  tableName: 'type_requirements',
  timestamps: true,
  underscored: true,
});

export default TypeRequirement;
