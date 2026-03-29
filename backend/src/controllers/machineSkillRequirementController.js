import MachineSkillRequirement from '../models/MachineSkillRequirement.js';
import { sendError, sendResponse } from '../utils/response.js';

export const getMachineSkillRequirements = async (req, res) => {
  try {
    const { status, machine, skill } = req.query;
    const where = {};
    if (status) where.status = status;
    if (machine) where.machine = machine;
    if (skill) where.skill = skill;
    const rows = await MachineSkillRequirement.findAll({ where, order: [['machine', 'ASC'], ['skill', 'ASC']] });
    return sendResponse(res, 200, 'Machine-skill requirements fetched successfully', rows);
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch machine-skill requirements', error.message);
  }
};

export const createMachineSkillRequirement = async (req, res) => {
  try {
    const { machine, skill, status } = req.body;
    const entry = await MachineSkillRequirement.create({ machine, skill, status: status || 'Active' });
    return sendResponse(res, 201, 'Machine-skill requirement created', entry);
  } catch (error) {
    return sendError(res, 500, 'Failed to create machine-skill requirement', error.message);
  }
};

export const updateMachineSkillRequirement = async (req, res) => {
  try {
    const { id } = req.params;
    const { machine, skill, status } = req.body;
    const entry = await MachineSkillRequirement.findByPk(id);
    if (!entry) return sendError(res, 404, 'Machine-skill requirement not found');
    entry.machine = machine;
    entry.skill = skill;
    entry.status = status || entry.status;
    await entry.save();
    return sendResponse(res, 200, 'Machine-skill requirement updated', entry);
  } catch (error) {
    return sendError(res, 500, 'Failed to update machine-skill requirement', error.message);
  }
};

export const deleteMachineSkillRequirement = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await MachineSkillRequirement.findByPk(id);
    if (!entry) return sendError(res, 404, 'Machine-skill requirement not found');
    await entry.destroy();
    return sendResponse(res, 200, 'Machine-skill requirement deleted');
  } catch (error) {
    return sendError(res, 500, 'Failed to delete machine-skill requirement', error.message);
  }
};
