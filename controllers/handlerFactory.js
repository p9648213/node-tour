const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.getOne = (Model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);

    if (populateOptions) {
      query = query.populate(populateOptions);
    }

    const doc = await query;

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res) => {
    // To allow for nested Get reviews on tour
    let filter = {};

    if (req.params.tourId) {
      filter = { tour: req.params.tourId };
    }

    //EXECUTE QUERY
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields();

    // Clone the query object to preserve the original query
    const countQuery = features.query.clone();

    // Get the total number of documents after filter and sort
    const totalDocsBeforePaginate = await countQuery.countDocuments();

    let limit = parseInt(req.query.limit);

    let doc = [];

    if (req.query.limit && !isNaN(limit)) {
      if (totalDocsBeforePaginate > 0) {
        if (totalDocsBeforePaginate <= limit) {
          doc = await features.query;
        } else {
          doc = await features.paginate().query;
        }
      }
    } else {
      doc = await features.paginate().query;
    }

    //SEND RESPONSE
    res.status(200).json({
      status: 'sucess',
      requestedAt: req.requestTime,
      totalDocsBeforePaginate: totalDocsBeforePaginate,
      results: doc.length,
      data: {
        data: doc,
      },
    });
  });
