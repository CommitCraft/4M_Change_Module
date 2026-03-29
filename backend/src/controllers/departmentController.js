import Department from '../models/Department.js';
import { sendError, sendResponse } from '../utils/response.js';

export const getDepartments = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;
    const rows = await Department.findAll({ where, order: [['name', 'ASC']] });
    return sendResponse(res, 200, 'Departments fetched successfully', rows);
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch departments', error.message);
  }
};

export const createDepartment = async (req, res) => {
  try {
    const { name, status } = req.body;
    const entry = await Department.create({ name, status: status || 'Active' });
    return sendResponse(res, 201, 'Department created', entry);
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
    return sendResponse(res, 200, 'Department updated', entry);
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
