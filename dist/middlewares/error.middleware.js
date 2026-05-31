"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const app_error_1 = require("../common/utils/app-error");
const api_response_dto_1 = require("../common/dto/api-response.dto");
const logger_1 = __importDefault(require("../config/logger"));
const env_1 = require("../config/env");
const errorMiddleware = (err, _req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
_next) => {
    let statusCode = 500;
    let message = 'Internal Server Error';
    let errors = null;
    // Log error
    logger_1.default.error(`${err.name}: ${err.message}\nStack: ${err.stack}`);
    // Handle custom AppError
    if (err instanceof app_error_1.AppError) {
        statusCode = err.statusCode;
        message = err.message;
        errors = err.errors;
    }
    // Handle Zod Schema validation errors
    else if (err instanceof zod_1.ZodError) {
        statusCode = 400;
        message = 'Validation Error';
        errors = err.errors.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
        }));
    }
    // Handle Prisma Database Engine errors
    else if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        switch (err.code) {
            case 'P2002': {
                statusCode = 409;
                const target = err.meta?.target || [];
                message = `Unique constraint failed on field: ${target.join(', ')}`;
                break;
            }
            case 'P2025': {
                statusCode = 404;
                message = 'Record to update or delete was not found.';
                break;
            }
            case 'P2003': {
                statusCode = 400;
                message = 'Foreign key constraint failed.';
                break;
            }
            default: {
                statusCode = 400;
                message = `Database error: ${err.message}`;
            }
        }
    }
    else if (err instanceof client_1.Prisma.PrismaClientValidationError) {
        statusCode = 400;
        message = 'Database validation failed.';
    }
    // Response formatting
    const response = api_response_dto_1.ResponseDto.error(message, errors);
    // Attach stack trace only in development
    if (env_1.env.NODE_ENV === 'development') {
        response.stack = err.stack;
    }
    res.status(statusCode).json(response);
};
exports.errorMiddleware = errorMiddleware;
exports.default = exports.errorMiddleware;
