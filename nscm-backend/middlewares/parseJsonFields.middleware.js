/* Converts JSON‑string fields (e.g., geoLocation) into objects */
module.exports = (fields) => (req, _res, next) => {
  try {
    fields.forEach((key) => {
      if (req.body[key] && typeof req.body[key] === 'string') {
        req.body[key] = JSON.parse(req.body[key]);
      }
    });
    next();
  } catch {
    next(new Error(`Invalid JSON in one of: ${fields.join(', ')}`));
  }
};
