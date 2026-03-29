import TypeRequirement from '../models/TypeRequirement.js';
import { sendError, sendResponse } from '../utils/response.js';

export const getTypeRequirements = async (req, res) => {
  try {
    const { status, type } = req.query;
    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;
    const rows = await TypeRequirement.findAll({ where, order: [['type', 'ASC'], ['name', 'ASC']] });
    return sendResponse(res, 200, 'Type requirements fetched successfully', rows);
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch type requirements', error.message);
  }
};

export const createTypeRequirement = async (req, res) => {
  try {
    const { type, name, status } = req.body;
    const entry = await TypeRequirement.create({ type, name, status: status || 'Active' });
    return sendResponse(res, 201, 'Type requirement created', entry);
  } catch (error) {
    return sendError(res, 500, 'Failed to create type requirement', error.message);
  }
};

export const updateTypeRequirement = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, name, status } = req.body;
    const entry = await TypeRequirement.findByPk(id);
    if (!entry) return sendError(res, 404, 'Type requirement not found');
    entry.type = type;
    entry.name = name;
    entry.status = status || entry.status;
    await entry.save();
    return sendResponse(res, 200, 'Type requirement updated', entry);
  } catch (error) {
    return sendError(res, 500, 'Failed to update type requirement', error.message);
  }
};

export const deleteTypeRequirement = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await TypeRequirement.findByPk(id);
    if (!entry) return sendError(res, 404, 'Type requirement not found');
    await entry.destroy();
    return sendResponse(res, 200, 'Type requirement deleted');
  } catch (error) {
    return sendError(res, 500, 'Failed to delete type requirement', error.message);
  }
};
