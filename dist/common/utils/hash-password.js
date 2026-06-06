"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const env_1 = require("../../config/env");
/**
 * Hashes a raw password string using bcrypt.
 * @param password The raw password to hash.
 * @returns A Promise resolving to the hashed password string.
 */
const hashPassword = async (password) => {
    return bcrypt_1.default.hash(password, env_1.env.BCRYPT_SALT_ROUNDS);
};
exports.hashPassword = hashPassword;
