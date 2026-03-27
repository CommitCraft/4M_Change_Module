import express from 'express';
import multer from 'multer';
import path from 'path';
import { uploadFile, downloadFile, deleteFile, getRequestAttachments } from '../controllers/fileController.js';
import { authMiddleware, authorizePermissions } from '../middleware/auth.js';
import { param } from 'express-validator';
import { validateRequest } from '../middleware/validators.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 },
});

router.use(authMiddleware);

router.get('/request/:id', authorizePermissions('attachments.read'), [param('id').isInt({ min: 1 }).withMessage('Invalid request id')], validateRequest, getRequestAttachments);
router.post('/:id/upload', authorizePermissions('attachments.upload'), [param('id').isInt({ min: 1 }).withMessage('Invalid request id')], validateRequest, upload.single('file'), uploadFile);
router.get('/:filename', authorizePermissions('attachments.read'), downloadFile);
router.delete('/:id', authorizePermissions('attachments.delete'), [param('id').isInt({ min: 1 }).withMessage('Invalid attachment id')], validateRequest, deleteFile);

export default router;
