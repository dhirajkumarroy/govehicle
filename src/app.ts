import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env';
import logger from './config/logger';
import { errorMiddleware } from './middlewares/error.middleware';
import { rateLimiter } from './middlewares/rate-limit.middleware';
import indexRouter from './routes/index.routes';
import { NotFoundError } from './common/utils/app-error';

const app: Application = express();

// 1. Security Headers Middleware
app.use(helmet());

// 2. Cross-Origin Resource Sharing
app.use(
  cors({
    origin: '*', // In production, customize this to trust specific domains
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// 3. Request Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. HTTP Request Logging Middleware (Morgan piped into Winston)
const morganStream = {
  write: (message: string) => logger.http(message.trim()),
};
const morganMiddleware = morgan(
  ':remote-addr - :method :url :status :res[content-length] - :response-time ms',
  { stream: morganStream }
);
app.use(morganMiddleware);

// 5. Global Rate Limiter
app.use(env.API_PREFIX, rateLimiter);

// 6. Swagger API Documentation Configuration
const swaggerOptions: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GoVehicle API Documentation',
      version: '1.0.0',
      description: 'Production-ready REST API for the Vehicle Booking Marketplace application',
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}${env.API_PREFIX}`,
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

const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 7. Base Routes
app.use(env.API_PREFIX, indexRouter);

// Redirect root URL to swagger docs for premium dev UX
app.get('/', (_req: Request, res: Response) => {
  res.redirect('/api-docs');
});

// 8. Catch-all for unhandled routes -> throws NotFoundError
app.use((req: Request, _res: Response, next: NextFunction) => {
  next(new NotFoundError(`Requested path '${req.originalUrl}' not found.`));
});

// 9. Centralized Error Handling Middleware (must be registered last)
app.use(errorMiddleware);

export default app;
