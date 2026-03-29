import models from '../models/index.js';
const { MasterData } = models;
import { sendError, sendResponse } from '../utils/response.js';

export const getMasters = async (req, res) => {
  try {
    const { category, type, status } = req.query;
    const where = {};

    if (category) where.category = category;
    if (type) where.type = type;
    if (status) where.status = status;

    const rows = await MasterData.findAll({ where, order: [['category', 'ASC'], ['type', 'ASC'], ['name', 'ASC']] });
    return sendResponse(res, 200, 'Masters fetched successfully', rows);
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch masters', error.message);
  }
};

export const createMaster = async (req, res) => {
  try {
    const { category, type, name, status } = req.body;
    const entry = await MasterData.create({ category, type: type || null, name, status: status || 'Active' });
    return sendResponse(res, 201, 'Master entry created', entry);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return sendError(res, 409, 'Master entry already exists');
    }
    return sendError(res, 500, 'Failed to create master entry', error.message);
  }
};

export const deleteMaster = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await MasterData.findByPk(id);

    if (!entry) {
      return sendError(res, 404, 'Master entry not found');
    }

    await entry.destroy();
    return sendResponse(res, 200, 'Master entry deleted');
  } catch (error) {
    return sendError(res, 500, 'Failed to delete master entry', error.message);
  }
};

export const updateMaster = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, type, name, status } = req.body;

    const entry = await MasterData.findByPk(id);
    if (!entry) {
      return sendError(res, 404, 'Master entry not found');
    }

    entry.category = category;
    entry.type = type || null;
    entry.name = name;
    entry.status = status || entry.status;
    await entry.save();

    return sendResponse(res, 200, 'Master entry updated', entry);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return sendError(res, 409, 'Master entry already exists');
    }
    return sendError(res, 500, 'Failed to update master entry', error.message);
  }
};
