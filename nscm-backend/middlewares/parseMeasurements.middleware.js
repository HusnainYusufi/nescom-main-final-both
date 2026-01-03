// middlewares/parseMeasurements.middleware.js
module.exports = (req, _res, next) => {
  if (req.body.measurements && typeof req.body.measurements === 'string') {
    try {
      req.body.measurements = JSON.parse(req.body.measurements);
    } catch {
      return next(new Error('measurements must be valid JSON'));
    }
  }
  next();
};
