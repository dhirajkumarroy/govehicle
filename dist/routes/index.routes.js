"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const api_response_dto_1 = require("../common/dto/api-response.dto");
const router = (0, express_1.Router)();
/**
 * @openapi
 * /health:
 *   get:
 *     summary: Get API health status
 *     description: Checks if the application server is up and running.
 *     responses:
 *       200:
 *         description: Server is healthy and running.
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
 *                   example: Server is healthy and running.
 */
router.get('/health', (_req, res) => {
    res.status(200).json(api_response_dto_1.ResponseDto.success('Server is healthy and running.', {
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    }));
});
// Future sub-routes (e.g. Auth, Users, Vehicles, Bookings) will be registered here
exports.default = router;
