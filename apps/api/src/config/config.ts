import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.string().default('3000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  DATABASE_URL: z.string().min(1),
  KITE_API_KEY: z.string().min(1),
  KITE_API_SECRET: z.string().min(1),
  KITE_REDIRECT_URL: z.string().url(),
  JWT_SECRET: z.string().min(1),
  ENCRYPTION_KEY: z.string().length(64),
  ENABLE_MOCK_DATA: z.string().optional().default('false').transform(val => val === 'true'),
  ALLOWED_ORIGIN: z.string().url().optional().default('http://localhost:5173')
});

export const config = envSchema.parse(process.env);
