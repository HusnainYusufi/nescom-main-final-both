'use strict';
const AppError = require('../modules/AppError');

/* Converts JSON-string fields (e.g., 'geoLocation') into objects */
module.exports = (fields = []) => (req, _res, next) => {
  try {
    for (const key of fields) {
      if (req.body[key] && typeof req.body[key] === 'string') {
        req.body[key] = JSON.parse(req.body[key]);
      }
    }
    next();
  } catch {
    next(new AppError(`Invalid JSON in one of: ${fields.join(', ')}`, 400));
  }
};
