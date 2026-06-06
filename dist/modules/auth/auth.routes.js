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
 * /auth/verify-otp:
 *   post:
 *     summary: Verify email verification OTP
 *     description: Verifies user account and marks email as verified.
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
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: dhiraj@example.com
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Email verified successfully.
 *       400:
 *         description: Invalid or expired OTP code.
 *       404:
 *         description: User profile not found.
 */
router.post('/verify-otp', controller.verifyOtp);
/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Log in credentials and get session token
 *     description: Authenticates user credentials and stores secure refresh session cookies.
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
 *         description: Login successful. Cookies generated.
 *       401:
 *         description: Invalid email or password.
 *       403:
 *         description: Blocked. Email address is not verified.
 */
router.post('/login', controller.login);
/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     summary: Initiate password recovery OTP
 *     description: Sends a password recovery OTP code if the email address exists.
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
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: dhiraj@example.com
 *     responses:
 *       200:
 *         description: Recovery OTP code processed.
 */
router.post('/forgot-password', controller.forgotPassword);
/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with OTP
 *     description: Verifies password recovery OTP and resets user password.
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
 *               - code
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: dhiraj@example.com
 *               code:
 *                 type: string
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: NewPassword@123
 *     responses:
 *       200:
 *         description: Password reset successfully.
 *       400:
 *         description: Invalid or expired OTP reset code.
 *       404:
 *         description: User profile not found.
 */
router.post('/reset-password', controller.resetPassword);
/**
 * @openapi
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh Access Token
 *     description: Generates a new access JWT using standard HTTP-only session refresh cookies.
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: Access token successfully refreshed.
 *       401:
 *         description: Cookie expired or session was destroyed.
 */
router.post('/refresh-token', controller.refreshToken);
/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Log user out
 *     description: Destroys secure refresh session cookies.
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: Logout successful. Cookies cleared.
 */
router.post('/logout', controller.logout);
exports.default = router;
