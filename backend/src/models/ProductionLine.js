import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ProductionLine extends Model {}

ProductionLine.init(
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
    modelName: 'ProductionLine',
    tableName: 'production_lines',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default ProductionLine;
