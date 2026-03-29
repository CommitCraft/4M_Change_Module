
import sequelize from '../config/database.js';
import RiskLevel from './RiskLevel.js';
import TypeActionTemplate from './TypeActionTemplate.js';
import TypeRequirement from './TypeRequirement.js';
import TrainingProgram from './TrainingProgram.js';
import MachineSkillRequirement from './MachineSkillRequirement.js';
import OperatorSkillMap from './OperatorSkillMap.js';
import Skill from './Skill.js';
import Operator from './Operator.js';
import ChangeSubType from './ChangeSubType.js';
import ProductionLine from './ProductionLine.js';
import Machine from './Machine.js';
import Role from './Role.js';
import RolePermission from './RolePermission.js';
import User from './User.js';
import ChangeRequest from './ChangeRequest.js';
import Approval from './Approval.js';
import AuditLog from './AuditLog.js';
import Attachment from './Attachment.js';
import MasterData from './MasterData.js';
import GuidedSetupProgress from './GuidedSetupProgress.js';
import Department from './Department.js';

Role.hasMany(User, { foreignKey: 'role_id' });
User.belongsTo(Role, { foreignKey: 'role_id' });
Role.hasOne(RolePermission, { foreignKey: 'role_id', onDelete: 'CASCADE' });
RolePermission.belongsTo(Role, { foreignKey: 'role_id' });

User.hasMany(ChangeRequest, { foreignKey: 'created_by' });
ChangeRequest.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

ChangeRequest.hasMany(Approval, { foreignKey: 'request_id' });
Approval.belongsTo(ChangeRequest, { foreignKey: 'request_id' });
Approval.belongsTo(User, { foreignKey: 'approver_id', as: 'approver' });

ChangeRequest.hasMany(Attachment, { foreignKey: 'request_id' });
Attachment.belongsTo(ChangeRequest, { foreignKey: 'request_id' });

AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'actor' });
AuditLog.belongsTo(ChangeRequest, { foreignKey: 'request_id' });
ChangeRequest.hasMany(AuditLog, { foreignKey: 'request_id' });

User.hasMany(GuidedSetupProgress, { foreignKey: 'user_id' });
GuidedSetupProgress.belongsTo(User, { foreignKey: 'user_id' });
Department.hasMany(User, { foreignKey: 'department_id' });
User.belongsTo(Department, { foreignKey: 'department_id' });

// ...existing code...
export default {
  sequelize,
  Department,
  Role,
  RolePermission,
  User,
  ChangeRequest,
  Approval,
  AuditLog,
  Attachment,
  MasterData,
  GuidedSetupProgress,
  ProductionLine,
  Machine,
  ChangeSubType,
  TypeActionTemplate,
  TypeRequirement,
  TrainingProgram,
  MachineSkillRequirement,
  OperatorSkillMap,
  Skill,
  Operator,
  RiskLevel
};