import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class BusinessRole extends Model {}

BusinessRole.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    m_module: {
      type: DataTypes.ENUM('Man', 'Machine', 'Material', 'Method', 'User'),
      allowNull: false,
    },
    role_name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    focus_area: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive'),
      allowNull: false,
      defaultValue: 'Active',
    },
  },
  {
    sequelize,
    modelName: 'BusinessRole',
    tableName: 'business_roles',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['m_module', 'role_name'],
      },
    ],
  }
);

export default BusinessRole;
