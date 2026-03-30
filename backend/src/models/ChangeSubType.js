import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ChangeSubType = sequelize.define('ChangeSubType', {
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
    unique: true,
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive'),
    defaultValue: 'Active',
  },
}, {
  tableName: 'change_sub_types',
  timestamps: true,
  underscored: true,
});

export default ChangeSubType;
