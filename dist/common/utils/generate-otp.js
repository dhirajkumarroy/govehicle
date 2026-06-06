"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOtp = void 0;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Generates a cryptographically secure 6-digit numeric OTP code.
 * @returns A 6-digit numeric string (e.g. "847291").
 */
const generateOtp = () => {
    // Generates a random integer between 100,000 and 999,999 inclusive
    const code = crypto_1.default.randomInt(100000, 1000000);
    return code.toString();
};
exports.generateOtp = generateOtp;
