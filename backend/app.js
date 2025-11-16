import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import session from 'express-session';
import passport from 'passport';

import connectDB from './config/db.js';
import './config/passport-setup.js';
import mainRouterV1 from './routes/index.routes.js';
import { bridge } from './bridge.js';
import { errorHandler } from './middlewares/errorHandler.middleware.js';
import { HttpStatusCode } from './constants/index.js';
import { rateLimiter } from './middlewares/rateLimiter.middleware.js';
import { paymentController } from './controllers/payment.controller.js';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerOptions from './config/swagger.js';
import teamRoutes from './routes/team.routes.js';

dotenv.config({ path: './.env' });

const app = express();
connectDB();

// ⚠️ CRITICAL: Webhook route MUST come BEFORE express.json()
app.post('/api/v1/payment/webhook', 
  express.raw({ type: 'application/json' }), 
  paymentController.handleStripeWebhook
);

// NOW add body parsers
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));

// Other middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || bridge.FRONTEND_URL, credentials: true }));
app.use(helmet());
app.use(morgan(bridge.isProduction ? 'combined' : 'dev'));
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: bridge.isProduction, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(rateLimiter);

// Routes
app.use('/api/v1', mainRouterV1);
const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }));
app.get('/', (req, res) => res.status(HttpStatusCode.OK).json({ message: "API is alive!", environment: bridge.NODE_ENV }));
app.get('/api/v1/health', (req, res) => res.status(HttpStatusCode.OK).json({ status: 'UP', timestamp: new Date().toISOString() }));
app.use('/api/v1/team', teamRoutes);

app.use(errorHandler);

export default app;