import models from '../models/index.js';
const { BusinessRole } = models;
import { sendError, sendResponse } from '../utils/response.js';

export const getBusinessRoles = async (req, res) => {
  try {
    const { m_module, status } = req.query;
    const where = {};

    if (m_module) where.m_module = m_module;
    if (status) where.status = status;

    const rows = await BusinessRole.findAll({
      where,
      order: [['m_module', 'ASC'], ['role_name', 'ASC']],
    });

    return sendResponse(res, 200, 'Business roles fetched successfully', rows);
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch business roles', error.message);
  }
};
