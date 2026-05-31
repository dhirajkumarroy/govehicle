"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
// Load environment variables from .env file
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    PORT: zod_1.z.coerce.number().default(5000),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    API_PREFIX: zod_1.z.string().default('/api/v1'),
    DATABASE_URL: zod_1.z.string({
        required_error: 'DATABASE_URL is required',
    }).url('DATABASE_URL must be a valid connection URL'),
    JWT_SECRET: zod_1.z.string({
        required_error: 'JWT_SECRET is required',
    }).min(8, 'JWT_SECRET must be at least 8 characters long'),
    JWT_REFRESH_SECRET: zod_1.z.string({
        required_error: 'JWT_REFRESH_SECRET is required',
    }).min(8, 'JWT_REFRESH_SECRET must be at least 8 characters long'),
    JWT_EXPIRES_IN: zod_1.z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: zod_1.z.string().default('7d'),
    BCRYPT_SALT_ROUNDS: zod_1.z.coerce.number().default(12),
    RATE_LIMIT_WINDOW_MS: zod_1.z.coerce.number().default(900000), // 15 mins
    RATE_LIMIT_MAX: zod_1.z.coerce.number().default(100),
    SMTP_HOST: zod_1.z.string().default('localhost'),
    SMTP_PORT: zod_1.z.coerce.number().default(25),
    SMTP_USER: zod_1.z.string().default(''),
    SMTP_PASS: zod_1.z.string().default(''),
    SMTP_FROM: zod_1.z.string().default('GoVehicle <no-reply@govehicle.com>'),
    CLOUDINARY_CLOUD_NAME: zod_1.z.string().default(''),
    CLOUDINARY_API_KEY: zod_1.z.string().default(''),
    CLOUDINARY_API_SECRET: zod_1.z.string().default(''),
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
exports.env = parseEnv();
