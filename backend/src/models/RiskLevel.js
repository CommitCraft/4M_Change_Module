import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class RiskLevel extends Model {}

RiskLevel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive'),
      allowNull: false,
      defaultValue: 'Active',
    },
  },
  {
    sequelize,
    modelName: 'RiskLevel',
    tableName: 'risk_levels',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default RiskLevel;
