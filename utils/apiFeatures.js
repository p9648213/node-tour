class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // 1) Filtering
    let queryObj = { ...this.queryString };

    if (this.queryString.name) {
      queryObj = {
        ...queryObj,
        name: { $regex: this.queryString.name, $options: 'i' },
      };
    }
    if (this.queryString.startLocation) {
      delete queryObj['startLocation'];
      queryObj = {
        ...queryObj,
        'startLocation.address': {
          $regex: this.queryString.startLocation,
          $options: 'i',
        },
      };
    }

    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // 2) Advanced Filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    //2) Sorting
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ') + ' _id';
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt _id');
    }
    return this;
  }

  limitFields() {
    //3) Field limit
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    //4) Pagination
    // page=2&limit=10, 1-10 page 1, 11-20 page 2
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }

  search() {
    //5) Search
    if (this.queryString.search) {
    }
  }
}

module.exports = APIFeatures;
