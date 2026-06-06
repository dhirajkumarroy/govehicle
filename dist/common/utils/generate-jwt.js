"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRefreshToken = exports.verifyAccessToken = exports.generateRefreshToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../config/env");
/**
 * Signs a short-lived JSON Web Token for API request authorization.
 * @param payload Strong-typed payload containing user identity.
 */
const generateAccessToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_SECRET, {
        expiresIn: env_1.env.JWT_EXPIRES_IN,
    });
};
exports.generateAccessToken = generateAccessToken;
/**
 * Signs a long-lived JSON Web Token for refreshing request access.
 * @param payload Strong-typed payload containing user identity.
 */
const generateRefreshToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_REFRESH_SECRET, {
        expiresIn: env_1.env.JWT_REFRESH_EXPIRES_IN,
    });
};
exports.generateRefreshToken = generateRefreshToken;
/**
 * Verifies and decodes an incoming Access Token.
 * @param token Raw access JWT from headers.
 * @throws An error if token is expired or signature is invalid.
 */
const verifyAccessToken = (token) => {
    return jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
};
exports.verifyAccessToken = verifyAccessToken;
/**
 * Verifies and decodes an incoming Refresh Token.
 * @param token Raw refresh JWT from cookies.
 * @throws An error if token is expired or signature is invalid.
 */
const verifyRefreshToken = (token) => {
    return jsonwebtoken_1.default.verify(token, env_1.env.JWT_REFRESH_SECRET);
};
exports.verifyRefreshToken = verifyRefreshToken;
