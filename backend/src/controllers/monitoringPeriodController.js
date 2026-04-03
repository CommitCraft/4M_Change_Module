import MonitoringPeriod from '../models/MonitoringPeriod.js';
import { sendError, sendResponse } from '../utils/response.js';

export const getMonitoringPeriods = async (req, res) => {
  try {
    const { status, type } = req.query;
    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;
    const rows = await MonitoringPeriod.findAll({ where, order: [['type', 'ASC'], ['name', 'ASC']] });
    return sendResponse(res, 200, 'Monitoring periods fetched successfully', rows);
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch monitoring periods', error.message);
  }
};

export const createMonitoringPeriod = async (req, res) => {
  try {
    const { type, name, status } = req.body;
    const entry = await MonitoringPeriod.create({ type, name, status: status || 'Active' });
    return sendResponse(res, 201, 'Monitoring period created', entry);
  } catch (error) {
    return sendError(res, 500, 'Failed to create monitoring period', error.message);
  }
};

export const updateMonitoringPeriod = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, name, status } = req.body;
    const entry = await MonitoringPeriod.findByPk(id);
    if (!entry) return sendError(res, 404, 'Monitoring period not found');
    entry.type = type;
    entry.name = name;
    entry.status = status || entry.status;
    await entry.save();
    return sendResponse(res, 200, 'Monitoring period updated', entry);
  } catch (error) {
    return sendError(res, 500, 'Failed to update monitoring period', error.message);
  }
};

export const deleteMonitoringPeriod = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await MonitoringPeriod.findByPk(id);
    if (!entry) return sendError(res, 404, 'Monitoring period not found');
    await entry.destroy();
    return sendResponse(res, 200, 'Monitoring period deleted');
  } catch (error) {
    return sendError(res, 500, 'Failed to delete monitoring period', error.message);
  }
};