import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const TABLES = ['approvals', 'attachments', 'audit_logs', 'change_requests'];
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.resolve(__dirname, '../uploads');

const main = async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT || 3306),
  });

  try {
    await conn.beginTransaction();
    await conn.query('SET FOREIGN_KEY_CHECKS=0');

    for (const table of TABLES) {
      await conn.query(`TRUNCATE TABLE ${table}`);
      console.log(`Truncated ${table}`);
    }

    for (const table of TABLES) {
      await conn.query(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
      console.log(`Reset AUTO_INCREMENT for ${table}`);
    }

    await conn.query('SET FOREIGN_KEY_CHECKS=1');
    await conn.commit();

    try {
      const entries = await fs.readdir(UPLOADS_DIR, { withFileTypes: true });
      for (const entry of entries) {
        const entryPath = path.join(UPLOADS_DIR, entry.name);
        if (entry.isDirectory()) {
          await fs.rm(entryPath, { recursive: true, force: true });
        } else {
          await fs.unlink(entryPath);
        }
      }
      console.log(`Cleared uploads directory: ${UPLOADS_DIR}`);
    } catch (uploadError) {
      console.error(`Uploads cleanup skipped: ${uploadError.message}`);
    }

    const [rows] = await conn.query(
      "SELECT table_name, table_rows FROM information_schema.tables WHERE table_schema = ? AND table_name IN ('approvals','attachments','audit_logs','change_requests') ORDER BY table_name",
      [process.env.DB_NAME]
    );

    console.log(JSON.stringify(rows, null, 2));
  } catch (error) {
    try {
      await conn.rollback();
    } catch (rollbackError) {
      console.error(`Rollback failed: ${rollbackError.message}`);
    }
    throw error;
  } finally {
    await conn.end();
  }
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
