import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class GuidedSetupProgress extends Model {}

GuidedSetupProgress.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    flow_type: {
      type: DataTypes.ENUM('Man', 'Machine', 'Method', 'Material'),
      allowNull: false,
    },
    completed_steps: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    current_step_index: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    draft_forms: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
    },
  },
  {
    sequelize,
    modelName: 'GuidedSetupProgress',
    tableName: 'guided_setup_progress',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'flow_type'],
      },
    ],
  }
);

export default GuidedSetupProgress;
