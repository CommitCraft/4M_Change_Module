import ChangeSubType from '../models/ChangeSubType.js';
import { sendError, sendResponse } from '../utils/response.js';

export const getChangeSubTypes = async (req, res) => {
  try {
    const { status, type } = req.query;
    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;
    const rows = await ChangeSubType.findAll({ where, order: [['name', 'ASC']] });
    return sendResponse(res, 200, 'Change subtypes fetched successfully', rows);
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch change subtypes', error.message);
  }
};

export const createChangeSubType = async (req, res) => {
  try {
    const { type, name, status } = req.body;
    const entry = await ChangeSubType.create({ type, name, status: status || 'Active' });
    return sendResponse(res, 201, 'Change subtype created', entry);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return sendError(res, 409, 'Change subtype already exists');
    }
    return sendError(res, 500, 'Failed to create change subtype', error.message);
  }
};

export const updateChangeSubType = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, name, status } = req.body;
    const entry = await ChangeSubType.findByPk(id);
    if (!entry) return sendError(res, 404, 'Change subtype not found');
    entry.type = type;
    entry.name = name;
    entry.status = status || entry.status;
    await entry.save();
    return sendResponse(res, 200, 'Change subtype updated', entry);
  } catch (error) {
    return sendError(res, 500, 'Failed to update change subtype', error.message);
  }
};

export const deleteChangeSubType = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await ChangeSubType.findByPk(id);
    if (!entry) return sendError(res, 404, 'Change subtype not found');
    await entry.destroy();
    return sendResponse(res, 200, 'Change subtype deleted');
  } catch (error) {
    return sendError(res, 500, 'Failed to delete change subtype', error.message);
  }
};
