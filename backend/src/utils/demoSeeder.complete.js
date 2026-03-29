import {
  Role, User, Department, ProductionLine, Machine, ChangeRequest,
  MasterData, ChangeSubType, Operator, Skill, OperatorSkillMap, MachineSkillRequirement,
  TrainingProgram, TypeRequirement, TypeActionTemplate
} from '../models/index.js';
import sequelize from '../config/database.js';
import bcrypt from 'bcryptjs';

async function seedAll() {
  await sequelize.sync({ force: true });

  // Roles
  const roles = await Role.bulkCreate([
    { name: 'SuperAdmin' },
    { name: 'Admin' },
    { name: 'Manager' },
    { name: 'User' },
  ]);

  // Departments
  const departments = await Department.bulkCreate([
    { name: 'Production', status: 'Active' },
    { name: 'Quality', status: 'Active' },
    { name: 'Maintenance', status: 'Active' },
    { name: 'HR', status: 'Inactive' },
  ]);

  // Production Lines
  const lines = await ProductionLine.bulkCreate([
    { name: 'Line A', status: 'Active' },
    { name: 'Line B', status: 'Active' },
    { name: 'Line C', status: 'Inactive' },
  ]);

  // Machines
  const machines = await Machine.bulkCreate([
    { name: 'Machine A', status: 'Active' },
    { name: 'Machine B', status: 'Active' },
    { name: 'Machine C', status: 'Inactive' },
  ]);

  // Users
  const password = await bcrypt.hash('password123', 10);
  const users = await User.bulkCreate([
    { name: 'Super Admin', email: 'super@demo.com', password, role_id: roles[0].id },
    { name: 'Admin User', email: 'admin@demo.com', password, role_id: roles[1].id },
    { name: 'Manager User', email: 'manager@demo.com', password, role_id: roles[2].id },
    { name: 'Normal User', email: 'user@demo.com', password, role_id: roles[3].id },
  ]);

  // MasterData
  await MasterData.bulkCreate([
    { category: 'machine_skill_requirement', type: 'Machine A', name: 'Welding' },
    { category: 'machine_skill_requirement', type: 'Machine A', name: 'Cutting' },
    { category: 'operator_skill_map', type: 'Operator 1', name: 'Welding' },
    { category: 'operator_skill_map', type: 'Operator 1', name: 'Cutting' },
    { category: 'type_requirement', type: 'Man', name: 'ID Proof Required' },
    { category: 'type_action_template', type: 'Machine', name: 'Routine Maintenance' },
  ]);

  // ChangeSubTypes
  await ChangeSubType.bulkCreate([
    { type: 'Method', name: 'Subtype X', status: 'Active' },
    { type: 'Material', name: 'Subtype Y', status: 'Active' },
    { type: 'Man', name: 'Subtype Z', status: 'Inactive' },
  ]);

  // Operators
  await Operator.bulkCreate([
    { name: 'Operator 1', status: 'Active' },
    { name: 'Operator 2', status: 'Active' },
    { name: 'Operator 3', status: 'Inactive' },
  ]);

  // Skills
  await Skill.bulkCreate([
    { name: 'Welding', status: 'Active' },
    { name: 'Cutting', status: 'Active' },
    { name: 'Assembly', status: 'Active' },
  ]);

  // OperatorSkillMap
  await OperatorSkillMap.bulkCreate([
    { operator: 'Operator 1', skill: 'Welding', status: 'Active' },
    { operator: 'Operator 1', skill: 'Cutting', status: 'Active' },
    { operator: 'Operator 2', skill: 'Assembly', status: 'Active' },
  ]);

  // MachineSkillRequirement
  await MachineSkillRequirement.bulkCreate([
    { machine: 'Machine A', skill: 'Welding', status: 'Active' },
    { machine: 'Machine A', skill: 'Cutting', status: 'Active' },
    { machine: 'Machine B', skill: 'Assembly', status: 'Active' },
  ]);

  // TrainingProgram
  await TrainingProgram.bulkCreate([
    { skill: 'Welding', name: 'Safety Training', status: 'Active' },
    { skill: 'Cutting', name: 'Advanced Cutting', status: 'Active' },
    { skill: 'Assembly', name: 'Assembly Basics', status: 'Inactive' },
  ]);

  // TypeRequirement
  await TypeRequirement.bulkCreate([
    { type: 'Man', name: 'ID Proof Required', status: 'Active' },
    { type: 'Machine', name: 'Maintenance Log', status: 'Active' },
    { type: 'Material', name: 'Material Certificate', status: 'Inactive' },
  ]);

  // TypeActionTemplate
  await TypeActionTemplate.bulkCreate([
    { type: 'Machine', name: 'Routine Maintenance', status: 'Active' },
    { type: 'Man', name: 'Attendance Check', status: 'Active' },
    { type: 'Material', name: 'Material Inspection', status: 'Inactive' },
  ]);

  // ChangeRequests (demo data)
  await ChangeRequest.bulkCreate([
    {
      type: 'Man',
      request_no: 'REQ-001',
      request_date: '2026-03-29',
      production_line: 'Line A',
      machine: 'Machine A',
      sub_type: 'Subtype Z',
      current_operator: 'Operator 1',
      proposed_operator: 'Operator 2',
      required_skills: 'Welding, Cutting',
      proposed_operator_skill_status: 'Matched',
      training_required: false,
      training_status: 'Not Required',
      training_notes: '',
      compliance_requirements: 'ID Proof Required',
      action_plan_required: true,
      action_plan_notes: 'Routine Maintenance',
      title: 'Operator Change',
      description: 'Change operator for Machine A',
      current_state: 'Operator 1 assigned',
      proposed_change: 'Assign Operator 2',
      reason: 'Operator 1 on leave',
      old_value: 'Operator 1',
      new_value: 'Operator 2',
      impact_analysis: 'Minimal',
      quality_impact: 'Low',
      cost_impact: 'Low',
      delivery_impact: 'Low',
      safety_impact: 'Low',
      monitoring_period: '1 week',
      quality_result: 'OK',
      defect_rate: '0.1%',
      monitoring_comments: 'No issues',
      risk_level: 'Low',
      department: 'Production',
      status: 'Pending',
      created_by: users[1].id,
    },
    {
      type: 'Machine',
      request_no: 'REQ-002',
      request_date: '2026-03-28',
      production_line: 'Line B',
      machine: 'Machine B',
      sub_type: 'Subtype X',
      current_operator: 'Operator 2',
      proposed_operator: 'Operator 3',
      required_skills: 'Assembly',
      proposed_operator_skill_status: 'Gap',
      training_required: true,
      training_status: 'Pending',
      training_notes: 'Needs Assembly Basics',
      compliance_requirements: 'Maintenance Log',
      action_plan_required: false,
      action_plan_notes: '',
      title: 'Machine Maintenance',
      description: 'Routine maintenance for Machine B',
      current_state: 'Running',
      proposed_change: 'Schedule maintenance',
      reason: 'Preventive',
      old_value: 'Running',
      new_value: 'Maintenance',
      impact_analysis: 'Positive',
      quality_impact: 'Medium',
      cost_impact: 'Medium',
      delivery_impact: 'Medium',
      safety_impact: 'Medium',
      monitoring_period: '2 weeks',
      quality_result: 'Pending',
      defect_rate: '0.2%',
      monitoring_comments: 'To be monitored',
      risk_level: 'Medium',
      department: 'Maintenance',
      status: 'Approved',
      created_by: users[2].id,
    },
  ]);

  console.log('All demo data seeded successfully!');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedAll().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}
