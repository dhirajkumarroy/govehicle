"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const router = (0, express_1.Router)();
const controller = new auth_controller_1.AuthController();
/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new user account
 *     description: Creates a customer account and sends an email containing a 6-digit verification OTP.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Dhiraj
 *               email:
 *                 type: string
 *                 format: email
 *                 example: dhiraj@example.com
 *               phone:
 *                 type: string
 *                 example: "9304730973"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password@123
 *     responses:
 *       201:
 *         description: User registered successfully. OTP generated.
 *       400:
 *         description: Validation payload error.
 *       409:
 *         description: Conflict. Email or Phone number already exists.
 */
router.post('/register', controller.register);
/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Log in credentials and get session token
 *     description: Authenticates user credentials and returns tokens.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: dhiraj@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password@123
 *     responses:
 *       200:
 *         description: Login successful. Tokens generated.
 *       401:
 *         description: Invalid email or password.
 *       403:
 *         description: Blocked. Email address is not verified.
 */
router.post('/login', controller.login);
/**
 * @openapi
 * /auth/verify-email:
 *   post:
 *     summary: Verify user email using OTP code
 *     description: Confirms a user's email address by validating the 6-digit OTP code sent during registration.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: dhiraj@example.com
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Email verified successfully.
 *       400:
 *         description: Validation payload error, invalid OTP, or expired OTP.
 *       404:
 *         description: User not found.
 */
router.post('/verify-email', controller.verifyEmail);
/**
 * @openapi
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh session access and refresh tokens
 *     description: Generates a new access token and rotating refresh token using a valid, unexpired refresh token.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully.
 *       401:
 *         description: Unauthorized. Invalid or expired refresh token, or user not found.
 *       403:
 *         description: Forbidden. User email is not verified.
 */
router.post('/refresh-token', controller.refreshToken);
exports.default = router;
