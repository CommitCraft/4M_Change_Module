export const sendResponse = (res, statusCode, message, data = null) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (res, statusCode, message, details = null) => {
  res.status(statusCode).json({
    success: false,
    message,
    details: process.env.NODE_ENV === 'development' ? details : undefined,
  });
};
