"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const booking_controller_1 = require("./booking.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const controller = new booking_controller_1.BookingController();
/**
 * @openapi
 * /bookings:
 *   post:
 *     summary: Request a new vehicle booking
 *     description: Submits a booking reservation request for a selected active vehicle listing. Authenticated users only.
 *     tags:
 *       - Bookings
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vehicleId
 *               - startDate
 *               - endDate
 *             properties:
 *               vehicleId:
 *                 type: string
 *                 format: uuid
 *                 example: 8bfc352c-e1a8-4fbf-8b13-931edb2b18f2
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-07-20T00:00:00.000Z"
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-07-25T00:00:00.000Z"
 *               notes:
 *                 type: string
 *                 example: Requesting early pickup if possible.
 *     responses:
 *       201:
 *         description: Booking requested successfully.
 *       400:
 *         description: Validation payload error, invalid date bounds, or attempt to book own vehicle.
 *       401:
 *         description: Unauthorized. Authentication token is missing, invalid, or expired.
 *       404:
 *         description: Vehicle not found.
 *       409:
 *         description: Conflict. The vehicle is already reserved for the selected date range.
 */
router.post('/', auth_middleware_1.authenticateRequest, controller.createBooking);
/**
 * @openapi
 * /bookings/my:
 *   get:
 *     summary: Retrieve bookings requested by the authenticated customer
 *     description: Returns a paginated list of bookings requested by the authenticated customer account.
 *     tags:
 *       - Bookings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Customer bookings retrieved successfully.
 *       401:
 *         description: Unauthorized access.
 */
router.get('/my', auth_middleware_1.authenticateRequest, controller.listCustomerBookings);
/**
 * @openapi
 * /bookings/owner:
 *   get:
 *     summary: Retrieve bookings received by the authenticated owner
 *     description: Returns a paginated list of bookings received for the owner's vehicle listings.
 *     tags:
 *       - Bookings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Owner bookings retrieved successfully.
 *       401:
 *         description: Unauthorized access.
 */
router.get('/owner', auth_middleware_1.authenticateRequest, controller.listOwnerBookings);
/**
 * @openapi
 * /bookings/{id}:
 *   get:
 *     summary: Retrieve booking details
 *     description: Returns details of a single booking listing by its UUID. Authorized to the booking customer, vehicle owner, or ADMIN.
 *     tags:
 *       - Bookings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Booking details retrieved successfully.
 *       401:
 *         description: Unauthorized access.
 *       403:
 *         description: Forbidden. Authenticated user has no access rights to this booking.
 *       404:
 *         description: Booking not found.
 */
router.get('/:id', auth_middleware_1.authenticateRequest, controller.getBookingDetails);
/**
 * @openapi
 * /bookings/{id}/confirm:
 *   patch:
 *     summary: Confirm a pending booking listing
 *     description: Confirms a pending booking. Restricted to the vehicle owner.
 *     tags:
 *       - Bookings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Booking confirmed successfully.
 *       400:
 *         description: State error. Booking is not in PENDING state.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden. User is not the owner of this vehicle.
 *       404:
 *         description: Booking not found.
 */
router.patch('/:id/confirm', auth_middleware_1.authenticateRequest, controller.confirmBooking);
/**
 * @openapi
 * /bookings/{id}/reject:
 *   patch:
 *     summary: Reject a pending booking listing
 *     description: Rejects a pending booking. Restricted to the vehicle owner.
 *     tags:
 *       - Bookings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Booking rejected successfully.
 *       400:
 *         description: State error. Booking is not in PENDING state.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden. User is not the owner of this vehicle.
 *       404:
 *         description: Booking not found.
 */
router.patch('/:id/reject', auth_middleware_1.authenticateRequest, controller.rejectBooking);
/**
 * @openapi
 * /bookings/{id}/cancel:
 *   patch:
 *     summary: Cancel a pending/confirmed booking
 *     description: Cancels a pending or confirmed booking. Restricted to the booking customer.
 *     tags:
 *       - Bookings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Booking cancelled successfully.
 *       400:
 *         description: State error. Booking is not in PENDING or CONFIRMED state.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden. User is not the customer who requested this booking.
 *       404:
 *         description: Booking not found.
 */
router.patch('/:id/cancel', auth_middleware_1.authenticateRequest, controller.cancelBooking);
exports.default = router;
