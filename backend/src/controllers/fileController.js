import models from '../models/index.js';
const { Attachment, AuditLog, ChangeRequest } = models;
import { sendResponse, sendError } from '../utils/response.js';
import path from 'path';
import fs from 'fs';

const canAccessRequest = (user, request) => {
  if (!request) return false;
  if (['SuperAdmin', 'Admin', 'Manager'].includes(user.role)) return true;
  return request.created_by === user.id;
};

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 400, 'No file uploaded');
    }

    const { id } = req.params;

    const request = await ChangeRequest.findByPk(id);
    if (!request) {
      return sendError(res, 404, 'Change request not found');
    }

    if (!canAccessRequest(req.user, request)) {
      return sendError(res, 403, 'You are not authorized to upload files for this request');
    }

    const filePath = `uploads/${req.file.filename}`;

    const attachment = await Attachment.create({
      request_id: id,
      file_path: filePath,
    });

    await AuditLog.create({
      request_id: id,
      user_id: req.user.id,
      action: 'UPDATED',
    });

    sendResponse(res, 201, 'File uploaded successfully', {
      id: attachment.id,
      filename: req.file.filename,
      path: filePath,
    });
  } catch (error) {
    sendError(res, 500, 'Error uploading file', error.message);
  }
};

export const downloadFile = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join('uploads', filename);

    if (!fs.existsSync(filePath)) {
      return sendError(res, 404, 'File not found');
    }

    const attachment = await Attachment.findOne({ where: { file_path: `uploads/${filename}` } });
    if (!attachment) {
      return sendError(res, 404, 'Attachment record not found');
    }

    const request = await ChangeRequest.findByPk(attachment.request_id);
    if (!canAccessRequest(req.user, request)) {
      return sendError(res, 403, 'You are not authorized to download this file');
    }

    return res.download(filePath);
  } catch (error) {
    sendError(res, 500, 'Error downloading file', error.message);
  }
};

export const deleteFile = async (req, res) => {
  try {
    const { id } = req.params;
    const attachment = await Attachment.findByPk(id);
    if (!attachment) {
      return sendError(res, 404, 'Attachment not found');
    }

    const filePath = path.join(attachment.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await attachment.destroy();

    sendResponse(res, 200, 'File deleted successfully');
  } catch (error) {
    sendError(res, 500, 'Error deleting file', error.message);
  }
};

export const getRequestAttachments = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await ChangeRequest.findByPk(id);
    if (!request) {
      return sendError(res, 404, 'Change request not found');
    }

    if (!canAccessRequest(req.user, request)) {
      return sendError(res, 403, 'You are not authorized to view attachments for this request');
    }

    const attachments = await Attachment.findAll({
      where: { request_id: id },
      order: [['uploaded_at', 'DESC']],
    });

    sendResponse(res, 200, 'Attachments fetched successfully', attachments);
  } catch (error) {
    sendError(res, 500, 'Error fetching attachments', error.message);
  }
};
