import Operator from '../models/Operator.js';
import { sendError, sendResponse } from '../utils/response.js';

export const getOperators = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;
    const rows = await Operator.findAll({ where, order: [['name', 'ASC']] });
    return sendResponse(res, 200, 'Operators fetched successfully', rows);
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch operators', error.message);
  }
};

export const createOperator = async (req, res) => {
  try {
    const { name, status } = req.body;
    const entry = await Operator.create({ name, status: status || 'Active' });
    return sendResponse(res, 201, 'Operator created', entry);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return sendError(res, 409, 'Operator already exists');
    }
    return sendError(res, 500, 'Failed to create operator', error.message);
  }
};

export const updateOperator = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;
    const entry = await Operator.findByPk(id);
    if (!entry) return sendError(res, 404, 'Operator not found');
    entry.name = name;
    entry.status = status || entry.status;
    await entry.save();
    return sendResponse(res, 200, 'Operator updated', entry);
  } catch (error) {
    return sendError(res, 500, 'Failed to update operator', error.message);
  }
};

export const deleteOperator = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await Operator.findByPk(id);
    if (!entry) return sendError(res, 404, 'Operator not found');
    await entry.destroy();
    return sendResponse(res, 200, 'Operator deleted');
  } catch (error) {
    return sendError(res, 500, 'Failed to delete operator', error.message);
  }
};
