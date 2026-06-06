"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("./user.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const controller = new user_controller_1.UserController();
/**
 * @openapi
 * /users/profile:
 *   get:
 *     summary: Get user profile details
 *     description: Retrieves the profile details of the authenticated user.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User profile retrieved successfully.
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: ae2921ef-f97d-49db-8bfe-99ad98c54842
 *                     email:
 *                       type: string
 *                       example: dhiraj@example.com
 *                     phone:
 *                       type: string
 *                       example: "9900000001"
 *                     name:
 *                       type: string
 *                       example: Dhiraj
                     role:
 *                       type: string
 *                       example: CUSTOMER
 *                     isEmailVerified:
 *                       type: boolean
 *                       example: true
 *                     avatar:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *       401:
 *         description: Unauthorized. Authentication token is missing, invalid, or expired.
 *       404:
 *         description: User profile not found.
 */
router.get('/profile', auth_middleware_1.authenticateRequest, controller.getProfile);
exports.default = router;
