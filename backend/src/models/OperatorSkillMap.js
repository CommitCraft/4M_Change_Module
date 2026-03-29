import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const OperatorSkillMap = sequelize.define('OperatorSkillMap', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  operator: {
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
  tableName: 'operator_skill_maps',
  timestamps: true,
  underscored: true,
});

export default OperatorSkillMap;
