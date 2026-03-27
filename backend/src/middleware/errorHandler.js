import { sendError } from '../utils/response.js';

export const notFoundHandler = (req, res) => {
  sendError(res, 404, `Route not found: ${req.originalUrl}`);
};

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;
  sendError(res, statusCode, err.message || 'Internal server error', err.stack);
};
