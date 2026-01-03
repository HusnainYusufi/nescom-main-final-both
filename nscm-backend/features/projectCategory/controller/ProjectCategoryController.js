const express = require('express');
const router = express.Router();
const ProjectCategoryService = require('../services/ProjectCategoryService');
const logger = require('../../../modules/logger');

router.post('/add', async (req, res, next) => {
  try {
    const result = await ProjectCategoryService.addCategory(req.body);
    return res.status(result.status).json(result);
  } catch (error) {
    logger.error('Error in ProjectCategoryController - Add Category:', {
      message: error.message,
      stack: error.stack,
      body: req.body
    });
    next(error);
  }
});

router.get('/all', async (req, res, next) => {
  try {
    const result = await ProjectCategoryService.getAllCategories();
    return res.status(result.status).json(result);
  } catch (error) {
    logger.error('Error in ProjectCategoryController - Get All Categories:', {
      message: error.message,
      stack: error.stack
    });
    next(error);
  }
});

module.exports = router;
