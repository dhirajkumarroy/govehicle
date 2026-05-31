"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDb = exports.prisma = void 0;
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("./logger"));
exports.prisma = globalThis.prisma || new client_1.PrismaClient({
    log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
    ],
});
if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma = exports.prisma;
}
// Log queries using Winston in development mode
if (process.env.NODE_ENV === 'development') {
    exports.prisma.$on('query', (e) => {
        logger_1.default.debug(`Query: ${e.query} | Params: ${e.params} | Duration: ${e.duration}ms`);
    });
}
const connectDb = async () => {
    try {
        await exports.prisma.$connect();
        logger_1.default.info('🐘 Database connected successfully via Prisma Client.');
    }
    catch (error) {
        logger_1.default.error('❌ Failed to connect to the database:', error);
        process.exit(1);
    }
};
exports.connectDb = connectDb;
exports.default = exports.prisma;
