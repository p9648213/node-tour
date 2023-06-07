const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const userRouter = require('./routes/userRouter');
const toursRouter = require('./routes/toursRouter');
const reviewsRouter = require('./routes/reviewsRouter');
const bookingRouter = require('./routes/bookingRoute');
const { webhookCheckout } = require('./controllers/bookingController');

const app = express();

//1)Global Middleware

// Cors
const whitelist = [
  'https://next-tour-kappa.vercel.app',
  'https://next-tour-git-master-lvp3795.vercel.app',
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (whitelist.indexOf(origin) !== -1 || !origin) {
        callback(null, true);
      } else {
        callback(new AppError(`${origin} not allowed by CORS`, 403));
      }
    },
  })
);

//Set security HTTP header
app.use(helmet.contentSecurityPolicy());

//Logging request
app.use(morgan('dev'));

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  window: 60 * 60 * 1000,
  message: 'Too many request from this IP, please try again in an hour!',
});

app.use('/api', limiter);

app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  webhookCheckout
);

//Body parser, reading data from body in req.body
app.use(express.json({ limit: '10kb' }));
//Optional, use in pubtemplate
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

//Data sanitization against NoSQL query injection
app.use(mongoSanitize());

//Data sanization against XSS
app.use(xss());

//Prevent parameter pollution
//Ex: ../tours?sort=duration&sort=price
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

//compress all the response
app.use(compression());

//Save request Time middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

//3) Routes
app.get('/', (req, res) => {
  res.send('Welcome To Nodejs Tour API Project');
});
app.use('/api/v1/tours', toursRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewsRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Cant find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
