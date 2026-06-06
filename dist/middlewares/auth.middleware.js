"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateRequest = void 0;
const generate_jwt_1 = require("../common/utils/generate-jwt");
const app_error_1 = require("../common/utils/app-error");
/**
 * Express middleware to authenticate API requests by verifying a Bearer access token.
 * Appends decodable JwtPayload onto req.user on success, otherwise routes to central error handling.
 */
const authenticateRequest = (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new app_error_1.UnauthorizedError('Authentication token is missing or invalid.');
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            throw new app_error_1.UnauthorizedError('Authentication token is missing.');
        }
        const decoded = (0, generate_jwt_1.verifyAccessToken)(token);
        req.user = decoded;
        next();
    }
    catch (error) {
        next(new app_error_1.UnauthorizedError('Authentication token is invalid or expired.'));
    }
};
exports.authenticateRequest = authenticateRequest;
exports.default = exports.authenticateRequest;
