import Machine from '../models/Machine.js';
import { sendError, sendResponse } from '../utils/response.js';

export const getMachines = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;
    const rows = await Machine.findAll({ where, order: [['name', 'ASC']] });
    return sendResponse(res, 200, 'Machines fetched successfully', rows);
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch machines', error.message);
  }
};

export const createMachine = async (req, res) => {
  try {
    const { name, status } = req.body;
    const entry = await Machine.create({ name, status: status || 'Active' });
    return sendResponse(res, 201, 'Machine created', entry);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return sendError(res, 409, 'Machine already exists');
    }
    return sendError(res, 500, 'Failed to create machine', error.message);
  }
};

export const updateMachine = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;
    const entry = await Machine.findByPk(id);
    if (!entry) return sendError(res, 404, 'Machine not found');
    entry.name = name;
    entry.status = status || entry.status;
    await entry.save();
    return sendResponse(res, 200, 'Machine updated', entry);
  } catch (error) {
    return sendError(res, 500, 'Failed to update machine', error.message);
  }
};

export const deleteMachine = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await Machine.findByPk(id);
    if (!entry) return sendError(res, 404, 'Machine not found');
    await entry.destroy();
    return sendResponse(res, 200, 'Machine deleted');
  } catch (error) {
    return sendError(res, 500, 'Failed to delete machine', error.message);
  }
};
