import ProductionLine from '../models/ProductionLine.js';
import { sendError, sendResponse } from '../utils/response.js';

export const getProductionLines = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;
    const rows = await ProductionLine.findAll({ where, order: [['name', 'ASC']] });
    return sendResponse(res, 200, 'Production lines fetched successfully', rows);
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch production lines', error.message);
  }
};

export const createProductionLine = async (req, res) => {
  try {
    const { name, status } = req.body;
    const entry = await ProductionLine.create({ name, status: status || 'Active' });
    return sendResponse(res, 201, 'Production line created', entry);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return sendError(res, 409, 'Production line already exists');
    }
    return sendError(res, 500, 'Failed to create production line', error.message);
  }
};

export const updateProductionLine = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;
    const entry = await ProductionLine.findByPk(id);
    if (!entry) return sendError(res, 404, 'Production line not found');
    entry.name = name;
    entry.status = status || entry.status;
    await entry.save();
    return sendResponse(res, 200, 'Production line updated', entry);
  } catch (error) {
    return sendError(res, 500, 'Failed to update production line', error.message);
  }
};

export const deleteProductionLine = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await ProductionLine.findByPk(id);
    if (!entry) return sendError(res, 404, 'Production line not found');
    await entry.destroy();
    return sendResponse(res, 200, 'Production line deleted');
  } catch (error) {
    return sendError(res, 500, 'Failed to delete production line', error.message);
  }
};
