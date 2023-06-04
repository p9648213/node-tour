const mongoose = require('mongoose');
const slugify = require('slugify');
//validator = require('validator');
//const User = require('./userModel');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxLength: [40, 'A tour name must have less or equal 40 characters'],
      minLength: [10, 'A tour name must have more or equal 10 characters'],
      // validate: {
      //   validator: validator.isAlpha,
      //   message: 'Tour name must only contain characters and no space',
      // },
    },
    slug: {
      type: String,
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10, // 4.666 => 46.666 => 47 => 4.7
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: async function (val) {
          //this.price is defined on create and save but not defined when update
          if (!this.price) {
            // Retrieve the current document by id
            const doc = await mongoose.models['Tour'].findById(
              this._conditions._id
            );
            return val < doc.price;
          }
          return val < this.price;
        },
        message: `Discount price ({VALUE}) should be below regular price`,
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a decription'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: function () {
        const currentDate = new Date();
        const utcOffset = 7 * 60 * 60 * 1000;
        return new Date(currentDate.getTime() + utcOffset);
      },
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      //GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//price descending, rating ascending reduce read time
tourSchema.index({
  price: 1,
  ratingsAverage: -1,
});
tourSchema.index({
  slug: 1,
});
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

//Virtual Populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// DOCUMENT MIDDLEWAR: run before .save() and .create()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

//QUERY MIDDLEWARE
//run before await query
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt -passwordResetExpires -passwordResetToken',
  });
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milisecond`);
  next();
});

//AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function (next) {
  if (Object.keys(this.pipeline()[0]).includes('$geoNear')) {
    this.pipeline().push({ $match: { secretTour: { $ne: true } } });
  } else {
    this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  }

  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
