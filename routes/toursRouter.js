const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../controllers/authController');

const {
  createTour,
  deleteTour,
  getAllTours,
  updateTour,
  getTour,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
  getDistances,
  getTourBySlug,
  resizeTourImages,
  uploadTourImages,
  getNumberOfTour,
} = require('../controllers/toursController');

const reviewRouter = require('../routes/reviewsRouter');

router.use('/:tourId/reviews', reviewRouter);

router.route('/tour-stats').get(getTourStats);

router.route('/top-5-cheap').get(aliasTopTours, getAllTours);

router
  .route('/monthly-plan/:year')
  .get(protect, restrictTo('admin', 'lead-guide', 'guide'), getMonthlyPlan);

// /tours-distance/233/center/-40,45/unit/mi
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(getDistances);

router.route('/numberOfTours').get(getNumberOfTour);

router
  .route('/')
  .get(getAllTours)
  .post(protect, restrictTo('admin', 'lead-guide'), createTour);

router
  .route('/:id')
  .get(getTour)
  .patch(
    protect,
    restrictTo('admin', 'lead-guide'),
    uploadTourImages,
    resizeTourImages,
    updateTour
  )
  .delete(protect, restrictTo('admin', 'lead-guide'), deleteTour);

router.route('/slug/:slug').get(getTourBySlug);

module.exports = router;
