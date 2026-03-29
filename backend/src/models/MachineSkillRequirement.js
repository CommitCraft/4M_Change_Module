import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const MachineSkillRequirement = sequelize.define('MachineSkillRequirement', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  machine: {
    type: DataTypes.STRING(120),
    allowNull: false,
  },
  skill: {
    type: DataTypes.STRING(120),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive'),
    defaultValue: 'Active',
  },
}, {
  tableName: 'machine_skill_requirements',
  timestamps: true,
  underscored: true,
});

export default MachineSkillRequirement;
