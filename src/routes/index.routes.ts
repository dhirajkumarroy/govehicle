import { Router } from 'express';
import { ResponseDto } from '../common/dto/api-response.dto';

const router = Router();

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
  res.status(200).json(
    ResponseDto.success('Server is healthy and running.', {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    })
  );
});

import authRouter from '../modules/auth/auth.routes';
import userRouter from '../modules/users/user.routes';
import vehicleRouter from '../modules/vehicles/vehicle.routes';
import bookingRouter from '../modules/bookings/booking.routes';
import notificationRouter from '../modules/notifications/notification.routes';

router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/vehicles', vehicleRouter);
router.use('/bookings', bookingRouter);
router.use('/notifications', notificationRouter);

export default router;

