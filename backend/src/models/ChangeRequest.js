import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class ChangeRequest extends Model {}

ChangeRequest.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    type: {
      type: DataTypes.ENUM('Man', 'Machine', 'Method', 'Material'),
      allowNull: false,
    },
    request_no: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    request_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    production_line: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    machine: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    sub_type: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    current_operator: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    proposed_operator: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    required_skills: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    proposed_operator_skill_status: {
      type: DataTypes.ENUM('Matched', 'Gap'),
      allowNull: true,
    },
    training_required: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    training_status: {
      type: DataTypes.ENUM('Not Required', 'Pending', 'Scheduled', 'Completed'),
      allowNull: true,
      defaultValue: 'Not Required',
    },
    training_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    compliance_requirements: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    action_plan_required: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    action_plan_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    current_state: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    proposed_change: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    old_value: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    new_value: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    impact_analysis: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    quality_impact: {
      type: DataTypes.ENUM('Low', 'Medium', 'High'),
      allowNull: true,
    },
    cost_impact: {
      type: DataTypes.ENUM('Low', 'Medium', 'High'),
      allowNull: true,
    },
    delivery_impact: {
      type: DataTypes.ENUM('Low', 'Medium', 'High'),
      allowNull: true,
    },
    safety_impact: {
      type: DataTypes.ENUM('Low', 'Medium', 'High'),
      allowNull: true,
    },
    monitoring_period: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    quality_result: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    defect_rate: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    monitoring_comments: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    risk_level: {
      type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
      allowNull: false,
    },
    department: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'Implemented', 'Closed'),
      allowNull: false,
      defaultValue: 'Pending',
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'ChangeRequest',
    tableName: 'change_requests',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default ChangeRequest;
