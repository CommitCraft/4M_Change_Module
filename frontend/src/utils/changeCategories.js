export const FOUR_M_CATEGORIES = {
  Man: [
    'Operator Change',
    'Supervisor Change',
    'Skill/Training Change',
    'Shift Manpower Change',
  ],
  Machine: [
    'Machine Replacement',
    'Maintenance',
    'Tooling/Mold/Die Change',
    'Machine Parameter Update',
  ],
  Method: [
    'SOP Update',
    'Process Flow Update',
    'Inspection Method Update',
    'Cycle Time Change',
  ],
  Material: [
    'Raw Material Change',
    'Vendor Change',
    'Grade/Specification Change',
    'Packaging Material Change',
  ],
};

export const FOUR_M_TYPES = Object.keys(FOUR_M_CATEGORIES);

export const getSubCategoriesByType = (type) => FOUR_M_CATEGORIES[type] || [];
