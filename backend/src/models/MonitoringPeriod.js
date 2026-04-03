import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const MonitoringPeriod = sequelize.define('MonitoringPeriod', {
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
  tableName: 'monitoring_periods',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['type', 'name'],
    },
  ],
});

export default MonitoringPeriod;