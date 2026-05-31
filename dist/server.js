"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const database_1 = require("./config/database");
const logger_1 = __importDefault(require("./config/logger"));
let server;
// Handle uncaught synchronous exceptions to prevent silent crashes
process.on('uncaughtException', (error) => {
    logger_1.default.error(`CRITICAL: Uncaught Exception: ${error.message}\nStack: ${error.stack}`);
    logger_1.default.info('Shutting down server due to uncaught exception...');
    process.exit(1);
});
// Handle unhandled asynchronous promise rejections
process.on('unhandledRejection', (reason) => {
    logger_1.default.error(`CRITICAL: Unhandled Promise Rejection: ${reason}`);
    logger_1.default.info('Shutting down server due to unhandled rejection...');
    process.exit(1);
});
const bootstrap = async () => {
    try {
        // 1. Establish connection with the database
        await (0, database_1.connectDb)();
        // 2. Start the HTTP Express Server
        server = app_1.default.listen(env_1.env.PORT, () => {
            logger_1.default.info(`===================================================`);
            logger_1.default.info(`🚀 Server is successfully running in [${env_1.env.NODE_ENV}] mode.`);
            logger_1.default.info(`📡 Listening on Port: http://localhost:${env_1.env.PORT}`);
            logger_1.default.info(`📖 Swagger Docs:      http://localhost:${env_1.env.PORT}/api-docs`);
            logger_1.default.info(`===================================================`);
        });
    }
    catch (error) {
        logger_1.default.error('❌ Failed to start the server:', error);
        process.exit(1);
    }
};
// Graceful shutdown logic when getting termination signals
const handleGracefulShutdown = (signal) => {
    logger_1.default.info(`\nReceived ${signal}. Starting graceful shutdown...`);
    if (server) {
        server.close(async () => {
            logger_1.default.info('HTTP server closed.');
            // Close Database Client connection
            try {
                await database_1.prisma.$disconnect();
                logger_1.default.info('Database connection closed gracefully.');
                process.exit(0);
            }
            catch (err) {
                logger_1.default.error('Error closing database connection:', err);
                process.exit(1);
            }
        });
    }
    else {
        process.exit(0);
    }
};
process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
// Start bootstrapping the server
bootstrap();
