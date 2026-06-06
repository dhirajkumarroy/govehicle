import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables dynamically based on file location, preventing CWD mismatches
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PREFIX: z.string().default('/api/v1'),
  
  DATABASE_URL: z.string({
    required_error: 'DATABASE_URL is required',
  }).url('DATABASE_URL must be a valid connection URL'),
  
  JWT_SECRET: z.string({
    required_error: 'JWT_SECRET is required',
  }).min(8, 'JWT_SECRET must be at least 8 characters long'),
  
  JWT_REFRESH_SECRET: z.string({
    required_error: 'JWT_REFRESH_SECRET is required',
  }).min(8, 'JWT_REFRESH_SECRET must be at least 8 characters long'),
  
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  BCRYPT_SALT_ROUNDS: z.coerce.number().default(12),
  
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000), // 15 mins
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().default(25),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  SMTP_FROM: z.string().default('GoVehicle <no-reply@govehicle.com>'),
  
  CLOUDINARY_CLOUD_NAME: z.string().default(''),
  CLOUDINARY_API_KEY: z.string().default(''),
  CLOUDINARY_API_SECRET: z.string().default(''),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  
  if (!result.success) {
    console.error('❌ Environment validation failed:');
    console.error(JSON.stringify(result.error.format(), null, 2));
    process.exit(1);
  }
  
  return result.data;
};

export const env = parseEnv();
export type Env = z.infer<typeof envSchema>;
