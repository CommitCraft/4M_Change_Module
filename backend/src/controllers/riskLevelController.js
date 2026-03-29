import models from '../models/index.js';
const { RiskLevel } = models;
import { sendResponse, sendError } from '../utils/response.js';

export const getAllRiskLevels = async (req, res) => {
  try {
    const riskLevels = await RiskLevel.findAll({ order: [['id', 'ASC']] });
    sendResponse(res, 200, 'Risk levels fetched', riskLevels);
  } catch (error) {
    sendError(res, 500, 'Error fetching risk levels', error.message);
  }
};

export const createRiskLevel = async (req, res) => {
  try {
    const { name, status } = req.body;
    const riskLevel = await RiskLevel.create({ name, status });
    sendResponse(res, 201, 'Risk level created', riskLevel);
  } catch (error) {
    sendError(res, 500, 'Error creating risk level', error.message);
  }
};

export const updateRiskLevel = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;
    const riskLevel = await RiskLevel.findByPk(id);
    if (!riskLevel) return sendError(res, 404, 'Risk level not found');
    await riskLevel.update({ name, status });
    sendResponse(res, 200, 'Risk level updated', riskLevel);
  } catch (error) {
    sendError(res, 500, 'Error updating risk level', error.message);
  }
};

export const deleteRiskLevel = async (req, res) => {
  try {
    const { id } = req.params;
    const riskLevel = await RiskLevel.findByPk(id);
    if (!riskLevel) return sendError(res, 404, 'Risk level not found');
    await riskLevel.destroy();
    sendResponse(res, 200, 'Risk level deleted');
  } catch (error) {
    sendError(res, 500, 'Error deleting risk level', error.message);
  }
};
