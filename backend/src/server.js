import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { bootstrapDatabase } from './config/bootstrap.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import models from './models/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
const rawCorsOrigin = process.env.CORS_ORIGIN || '*';
const allowedOrigins = rawCorsOrigin
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOriginResolver = allowedOrigins.includes('*')
  ? '*'
  : (origin, callback) => {
      // Allow requests without Origin header (Postman, curl, server-to-server).
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('CORS origin not allowed'));
    };

app.use(helmet());
app.use(cors({ origin: corsOriginResolver, credentials: true }));
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


// Use all routes from routes/index.js
app.use('/api', routes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use(notFoundHandler);
app.use(errorHandler);

const startServerAsync = async () => {
  try {
    await bootstrapDatabase();
    // Auto-create tables if not exist (sync all models)
    await models.sequelize.sync({ alter: false });
    app.listen(PORT, HOST, () => {
      console.log(`Server running on http://${HOST}:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

const startServer = () => startServerAsync().catch((error) => {
  console.error(`Failed to start server: ${error.message}`);
  process.exit(1);
});

if (process.env.NODE_ENV !== 'test') {
  startServerAsync();
}
