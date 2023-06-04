const express = require('express');
const router = express.Router();

const {
  getCheckoutSession,
  createBooking,
  deleteBooking,
  getAllBookings,
  getBooking,
  updateBooking,
  getMyTour,
} = require('./../controllers/bookingController');

const { protect, restrictTo } = require('./../controllers/authController');

router.use(protect);

router.get('/checkout-session/:tourId', getCheckoutSession);

router.get('/my-booking-tour', getMyTour);

router.use(restrictTo('admin', 'lead-guide'));

router.route('/').get(getAllBookings).post(createBooking);

router.route('/:id').get(getBooking).patch(updateBooking).delete(deleteBooking);

module.exports = router;
