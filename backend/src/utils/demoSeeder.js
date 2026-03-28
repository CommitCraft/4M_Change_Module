import { MasterData } from '../models/index.js';
import sequelize from '../config/database.js';


export async function seedDemoMasterData() {
  await sequelize.sync();
  await MasterData.destroy({ where: {} });
  const now = new Date();
  const baseFields = { created_at: now, updated_at: now };

  // Insert demo data for every category and field
  await MasterData.bulkCreate([
    // department
    { category: 'department', type: null, name: 'Production', status: 'Active', ...baseFields },
    // machine
    { category: 'machine', type: null, name: 'Machine A', status: 'Active', ...baseFields },
    // change_subtype (with type)
    { category: 'change_subtype', type: 'Method', name: 'Subtype X', status: 'Active', ...baseFields },
    { category: 'change_subtype', type: 'Material', name: 'Subtype Y', status: 'Active', ...baseFields },
    // risk_level
    { category: 'risk_level', type: null, name: 'Medium', status: 'Active', ...baseFields },
    // operator
    { category: 'operator', type: null, name: 'Operator 1', status: 'Active', ...baseFields },
    // skills
    { category: 'skill', type: null, name: 'Welding', status: 'Active', ...baseFields },
    { category: 'skill', type: null, name: 'Cutting', status: 'Active', ...baseFields },
    { category: 'skill', type: null, name: 'Assembly', status: 'Active', ...baseFields },
    // operator_skill_map (type = operator, name = skill)
    { category: 'operator_skill_map', type: 'Operator 1', name: 'Welding', status: 'Active', ...baseFields },
    { category: 'operator_skill_map', type: 'Operator 1', name: 'Cutting', status: 'Active', ...baseFields },
    { category: 'operator_skill_map', type: 'Operator 1', name: 'Assembly', status: 'Active', ...baseFields },
    // machine_skill_requirement (type = machine, name = skill)
    { category: 'machine_skill_requirement', type: 'Machine A', name: 'Welding', status: 'Active', ...baseFields },
    { category: 'machine_skill_requirement', type: 'Machine A', name: 'Cutting', status: 'Active', ...baseFields },
    // training_program (type = skill, name = program)
    { category: 'training_program', type: 'Welding', name: 'Safety Training', status: 'Active', ...baseFields },
    // type_requirement (type = 4M type, name = requirement)
    { category: 'type_requirement', type: 'Man', name: 'ID Proof Required', status: 'Active', ...baseFields },
    // type_action_template (type = 4M type, name = action)
    { category: 'type_action_template', type: 'Machine', name: 'Routine Maintenance', status: 'Active', ...baseFields },
  ]);

  console.log('Demo master data seeded for all fields!');
}

// Run directly (ESM compatible)
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDemoMasterData().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}