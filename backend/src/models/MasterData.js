import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class MasterData extends Model {}

MasterData.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    category: {
      type: DataTypes.ENUM(
        'department',
        'machine',
        'change_subtype',
        'risk_level',
        'operator',
        'skill',
        'operator_skill_map',
        'machine_skill_requirement',
        'training_program',
        'type_requirement',
        'type_action_template'
      ),
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive'),
      allowNull: false,
      defaultValue: 'Active',
    },
  },
  {
    sequelize,
    modelName: 'MasterData',
    tableName: 'master_data',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['category', 'type', 'name'],
      },
    ],
  }
);

export default MasterData;
