import OperatorSkillMap from '../models/OperatorSkillMap.js';
import { sendError, sendResponse } from '../utils/response.js';

export const getOperatorSkillMaps = async (req, res) => {
  try {
    const { status, operator, skill } = req.query;
    const where = {};
    if (status) where.status = status;
    if (operator) where.operator = operator;
    if (skill) where.skill = skill;
    const rows = await OperatorSkillMap.findAll({ where, order: [['operator', 'ASC'], ['skill', 'ASC']] });
    return sendResponse(res, 200, 'Operator-skill mappings fetched successfully', rows);
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch operator-skill mappings', error.message);
  }
};

export const createOperatorSkillMap = async (req, res) => {
  try {
    const { operator, skill, status } = req.body;
    const entry = await OperatorSkillMap.create({ operator, skill, status: status || 'Active' });
    return sendResponse(res, 201, 'Operator-skill mapping created', entry);
  } catch (error) {
    return sendError(res, 500, 'Failed to create operator-skill mapping', error.message);
  }
};

export const updateOperatorSkillMap = async (req, res) => {
  try {
    const { id } = req.params;
    const { operator, skill, status } = req.body;
    const entry = await OperatorSkillMap.findByPk(id);
    if (!entry) return sendError(res, 404, 'Operator-skill mapping not found');
    entry.operator = operator;
    entry.skill = skill;
    entry.status = status || entry.status;
    await entry.save();
    return sendResponse(res, 200, 'Operator-skill mapping updated', entry);
  } catch (error) {
    return sendError(res, 500, 'Failed to update operator-skill mapping', error.message);
  }
};

export const deleteOperatorSkillMap = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await OperatorSkillMap.findByPk(id);
    if (!entry) return sendError(res, 404, 'Operator-skill mapping not found');
    await entry.destroy();
    return sendResponse(res, 200, 'Operator-skill mapping deleted');
  } catch (error) {
    return sendError(res, 500, 'Failed to delete operator-skill mapping', error.message);
  }
};
