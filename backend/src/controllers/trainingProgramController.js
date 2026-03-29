import TrainingProgram from '../models/TrainingProgram.js';
import { sendError, sendResponse } from '../utils/response.js';

export const getTrainingPrograms = async (req, res) => {
  try {
    const { status, skill } = req.query;
    const where = {};
    if (status) where.status = status;
    if (skill) where.skill = skill;
    const rows = await TrainingProgram.findAll({ where, order: [['skill', 'ASC'], ['name', 'ASC']] });
    return sendResponse(res, 200, 'Training programs fetched successfully', rows);
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch training programs', error.message);
  }
};

export const createTrainingProgram = async (req, res) => {
  try {
    const { skill, name, status } = req.body;
    const entry = await TrainingProgram.create({ skill, name, status: status || 'Active' });
    return sendResponse(res, 201, 'Training program created', entry);
  } catch (error) {
    return sendError(res, 500, 'Failed to create training program', error.message);
  }
};

export const updateTrainingProgram = async (req, res) => {
  try {
    const { id } = req.params;
    const { skill, name, status } = req.body;
    const entry = await TrainingProgram.findByPk(id);
    if (!entry) return sendError(res, 404, 'Training program not found');
    entry.skill = skill;
    entry.name = name;
    entry.status = status || entry.status;
    await entry.save();
    return sendResponse(res, 200, 'Training program updated', entry);
  } catch (error) {
    return sendError(res, 500, 'Failed to update training program', error.message);
  }
};

export const deleteTrainingProgram = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await TrainingProgram.findByPk(id);
    if (!entry) return sendError(res, 404, 'Training program not found');
    await entry.destroy();
    return sendResponse(res, 200, 'Training program deleted');
  } catch (error) {
    return sendError(res, 500, 'Failed to delete training program', error.message);
  }
};
