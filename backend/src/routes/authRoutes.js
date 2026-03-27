import express from 'express';
import { login, getProfile } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';
import { loginValidation, validateRequest } from '../middleware/validators.js';

const router = express.Router();

router.post('/login', loginValidation, validateRequest, login);

router.get('/profile', authMiddleware, getProfile);

export default router;
