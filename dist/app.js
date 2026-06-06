"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const path_1 = __importDefault(require("path"));
const morgan_1 = __importDefault(require("morgan"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const env_1 = require("./config/env");
const logger_1 = __importDefault(require("./config/logger"));
const error_middleware_1 = require("./middlewares/error.middleware");
const rate_limit_middleware_1 = require("./middlewares/rate-limit.middleware");
const index_routes_1 = __importDefault(require("./routes/index.routes"));
const app_error_1 = require("./common/utils/app-error");
const app = (0, express_1.default)();
// 1. Security Headers Middleware
app.use((0, helmet_1.default)());
// 2. Cross-Origin Resource Sharing
app.use((0, cors_1.default)({
    origin: '*', // In production, customize this to trust specific domains
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));
// 3. Request Body Parsing
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// 4. HTTP Request Logging Middleware (Morgan piped into Winston)
const morganStream = {
    write: (message) => logger_1.default.http(message.trim()),
};
const morganMiddleware = (0, morgan_1.default)(':remote-addr - :method :url :status :res[content-length] - :response-time ms', { stream: morganStream });
app.use(morganMiddleware);
// 5. Global Rate Limiter
app.use(env_1.env.API_PREFIX, rate_limit_middleware_1.rateLimiter);
// 6. Swagger API Documentation Configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'GoVehicle API Documentation',
            version: '1.0.0',
            description: 'Production-ready REST API for the Vehicle Booking Marketplace application',
        },
        servers: [
            {
                url: `http://localhost:${env_1.env.PORT}${env_1.env.API_PREFIX}`,
                description: 'Local development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your JWT token in the format: Bearer <token>',
                },
            },
        },
    },
    // Include paths to search for OpenAPI decorators
    apis: ['./src/routes/*.ts', './src/routes/*.js', './src/modules/**/*.ts', './src/modules/**/*.js'],
};
const swaggerSpec = (0, swagger_jsdoc_1.default)(swaggerOptions);
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpec));
// 7. Serve Static Uploaded Files
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
// 8. Base Routes
app.use(env_1.env.API_PREFIX, index_routes_1.default);
// Redirect root URL to swagger docs for premium dev UX
app.get('/', (_req, res) => {
    res.redirect('/api-docs');
});
// 8. Catch-all for unhandled routes -> throws NotFoundError
app.use((req, _res, next) => {
    next(new app_error_1.NotFoundError(`Requested path '${req.originalUrl}' not found.`));
});
// 9. Centralized Error Handling Middleware (must be registered last)
app.use(error_middleware_1.errorMiddleware);
exports.default = app;
