const express = require('express');
const router = express.Router();
const ProjectService = require('../services/ProjectService');
const logger = require('../../../modules/logger');

router.post('/add', async (req, res, next) => {
  try {
    const result = await ProjectService.addProject(req.body);
    return res.status(result.status).json(result);
  } catch (error) {
    logger.error('Error in ProjectController - Add Project:', {
      message: error.message,
      stack: error.stack,
      body: req.body
    });
    next(error);
  }
});

router.get('/all', async (req, res, next) => {
  try {
    const result = await ProjectService.getAllProjects();
    return res.status(result.status).json(result);
  } catch (error) {
    logger.error('Error in ProjectController - Get All Projects:', {
      message: error.message,
      stack: error.stack
    });
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const result = await ProjectService.updateProject(req.params.id, req.body);
    return res.status(result.status).json(result);
  } catch (error) {
    logger.error('Error in ProjectController - Update Project:', {
      message: error.message,
      stack: error.stack,
      body: req.body,
      params: req.params
    });
    next(error);
  }
});

router.put('/:id/status', async (req, res, next) => {
  try {
    const result = await ProjectService.updateProjectStatus(req.params.id, req.body.status);
    return res.status(result.status).json(result);
  } catch (error) {
    logger.error('Error in ProjectController - Update Project Status:', {
      message: error.message,
      stack: error.stack,
      body: req.body,
      params: req.params
    });
    next(error);
  }
});

module.exports = router;
