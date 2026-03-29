import Skill from '../models/Skill.js';
import { sendError, sendResponse } from '../utils/response.js';

export const getSkills = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;
    const rows = await Skill.findAll({ where, order: [['name', 'ASC']] });
    return sendResponse(res, 200, 'Skills fetched successfully', rows);
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch skills', error.message);
  }
};

export const createSkill = async (req, res) => {
  try {
    const { name, status } = req.body;
    const entry = await Skill.create({ name, status: status || 'Active' });
    return sendResponse(res, 201, 'Skill created', entry);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return sendError(res, 409, 'Skill already exists');
    }
    return sendError(res, 500, 'Failed to create skill', error.message);
  }
};

export const updateSkill = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;
    const entry = await Skill.findByPk(id);
    if (!entry) return sendError(res, 404, 'Skill not found');
    entry.name = name;
    entry.status = status || entry.status;
    await entry.save();
    return sendResponse(res, 200, 'Skill updated', entry);
  } catch (error) {
    return sendError(res, 500, 'Failed to update skill', error.message);
  }
};

export const deleteSkill = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await Skill.findByPk(id);
    if (!entry) return sendError(res, 404, 'Skill not found');
    await entry.destroy();
    return sendResponse(res, 200, 'Skill deleted');
  } catch (error) {
    return sendError(res, 500, 'Failed to delete skill', error.message);
  }
};
