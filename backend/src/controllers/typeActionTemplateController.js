import TypeActionTemplate from '../models/TypeActionTemplate.js';
import { sendError, sendResponse } from '../utils/response.js';

export const getTypeActionTemplates = async (req, res) => {
  try {
    const { status, type } = req.query;
    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;
    const rows = await TypeActionTemplate.findAll({ where, order: [['type', 'ASC'], ['name', 'ASC']] });
    return sendResponse(res, 200, 'Type action templates fetched successfully', rows);
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch type action templates', error.message);
  }
};

export const createTypeActionTemplate = async (req, res) => {
  try {
    const { type, name, status } = req.body;
    const entry = await TypeActionTemplate.create({ type, name, status: status || 'Active' });
    return sendResponse(res, 201, 'Type action template created', entry);
  } catch (error) {
    return sendError(res, 500, 'Failed to create type action template', error.message);
  }
};

export const updateTypeActionTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, name, status } = req.body;
    const entry = await TypeActionTemplate.findByPk(id);
    if (!entry) return sendError(res, 404, 'Type action template not found');
    entry.type = type;
    entry.name = name;
    entry.status = status || entry.status;
    await entry.save();
    return sendResponse(res, 200, 'Type action template updated', entry);
  } catch (error) {
    return sendError(res, 500, 'Failed to update type action template', error.message);
  }
};

export const deleteTypeActionTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await TypeActionTemplate.findByPk(id);
    if (!entry) return sendError(res, 404, 'Type action template not found');
    await entry.destroy();
    return sendResponse(res, 200, 'Type action template deleted');
  } catch (error) {
    return sendError(res, 500, 'Failed to delete type action template', error.message);
  }
};
