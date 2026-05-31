"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("../config/env");
const api_response_dto_1 = require("../common/dto/api-response.dto");
exports.rateLimiter = (0, express_rate_limit_1.default)({
    windowMs: env_1.env.RATE_LIMIT_WINDOW_MS,
    max: env_1.env.RATE_LIMIT_MAX,
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: api_response_dto_1.ResponseDto.error('Too many requests from this IP, please try again after 15 minutes.'),
    handler: (_req, res, _next, options) => {
        res.status(options.statusCode).json(options.message);
    },
});
exports.default = exports.rateLimiter;
