'use strict';

try {
  require('dotenv').config();
  require('./config/redis');

  const express = require('express');
  const helmet = require('helmet');
  const cors = require('cors');
  const path = require('path');

  const { routes } = require('./config/Routes');
  const { Base } = require('./middlewares/Base');
  const logger = require('./modules/logger');

  // Require middlewares
  const _errorLogging = require('./middlewares/errorLoggingMiddleware');
  const _notFound = require('./middlewares/notFound');

  // Helper to gracefully handle default exports
  const toMiddleware = (m) =>
    typeof m === 'function'
      ? m
      : (m && typeof m.default === 'function' ? m.default : null);

  const errorLoggingMiddleware = toMiddleware(_errorLogging);
  const notFound = toMiddleware(_notFound);

  if (!errorLoggingMiddleware) throw new TypeError('errorLoggingMiddleware export is invalid');
  if (!notFound) throw new TypeError('notFound export is invalid');

  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(helmet());
  app.use(cors());
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  // IMPORTANT: mount routes + error handlers INSIDE the promise, in order.
  Base.init(app)
    .then(() => {
      // 1) mount all routes
      routes(app);

      // 2) 404 handler AFTER routes
      app.use(notFound);

      // 3) error handler LAST
      app.use(errorLoggingMiddleware);

      // If Base.init() doesn't start the server, uncomment:
      // app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
    })
    .catch((e) => {
      logger.error('Base.init failed', { message: e.message, stack: e.stack });
      process.exit(1);
    });

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', { message: err.message, stack: err.stack });
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection:', { reason: reason?.message || reason, stack: reason?.stack });
    process.exit(1);
  });

} catch (error) {
  console.error(error);
}
