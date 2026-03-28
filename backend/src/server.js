import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { bootstrapDatabase } from './config/bootstrap.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import roleRoutes from './routes/roleRoutes.js';
import changeRequestRoutes from './routes/changeRequestRoutes.js';
import approvalRoutes from './routes/approvalRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import masterRoutes from './routes/masterRoutes.js';
import guidedSetupRoutes from './routes/guidedSetupRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
  })
);

if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}
app.use('/uploads', express.static('./uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/change', changeRequestRoutes);
app.use('/api/approval', approvalRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/masters', masterRoutes);
app.use('/api/guided-setup', guidedSetupRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  try {
    await bootstrapDatabase();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
