import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const TrainingProgram = sequelize.define('TrainingProgram', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  skill: {
    type: DataTypes.STRING(120),
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
  tableName: 'training_programs',
  timestamps: true,
  underscored: true,
});

export default TrainingProgram;
