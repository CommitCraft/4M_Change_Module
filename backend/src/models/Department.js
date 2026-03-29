import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Department extends Model {}

Department.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(150),
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
    modelName: 'Department',
    tableName: 'departments',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Department;
