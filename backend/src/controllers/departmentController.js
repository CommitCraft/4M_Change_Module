import Department from '../models/Department.js';
import { sendError, sendResponse } from '../utils/response.js';

const DEPARTMENT_4M_LINKS = {
  'Production Department': 'Man,Method',
  'Quality Department (QA/QC)': 'Material,Method',
  'Maintenance Department': 'Machine',
  'Store / Inventory Department': 'Material',
  'Purchase / Procurement Department': 'Material',
  'R&D / Design Department': 'Method',
  'Process / Industrial Engineering (IE)': 'Method',
  'HR (Human Resource)': 'Man',
  'Finance / Accounts': '',
  'Logistics / Supply Chain': '',
  'EHS (Environment, Health & Safety)': '',
  'Continuous Improvement (CI / Lean Team)': '',
};

const attachFourMLink = (department) => {
  const plainDepartment = typeof department?.toJSON === 'function' ? department.toJSON() : department;
  if (!plainDepartment) return plainDepartment;

  return {
    ...plainDepartment,
    four_m_link: DEPARTMENT_4M_LINKS[plainDepartment.name] || '',
  };
};

export const getDepartments = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;
    const rows = await Department.findAll({ where, order: [['name', 'ASC']] });
    return sendResponse(res, 200, 'Departments fetched successfully', rows.map(attachFourMLink));
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch departments', error.message);
  }
};

export const createDepartment = async (req, res) => {
  try {
    const { name, status } = req.body;
    const entry = await Department.create({ name, status: status || 'Active' });
    return sendResponse(res, 201, 'Department created', attachFourMLink(entry));
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return sendError(res, 409, 'Department already exists');
    }
    return sendError(res, 500, 'Failed to create department', error.message);
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;
    const entry = await Department.findByPk(id);
    if (!entry) return sendError(res, 404, 'Department not found');
    entry.name = name;
    entry.status = status || entry.status;
    await entry.save();
    return sendResponse(res, 200, 'Department updated', attachFourMLink(entry));
  } catch (error) {
    return sendError(res, 500, 'Failed to update department', error.message);
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await Department.findByPk(id);
    if (!entry) return sendError(res, 404, 'Department not found');
    await entry.destroy();
    return sendResponse(res, 200, 'Department deleted');
  } catch (error) {
    return sendError(res, 500, 'Failed to delete department', error.message);
  }
};
