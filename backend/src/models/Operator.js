import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Operator = sequelize.define('Operator', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(120),
    allowNull: false,
    unique: true,
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive'),
    defaultValue: 'Active',
  },
}, {
  tableName: 'operators',
  timestamps: true,
  underscored: true,
});

export default Operator;
