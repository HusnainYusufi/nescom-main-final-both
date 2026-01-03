const express = require('express');
const router = express.Router();
const StructureService = require('../services/StructureService');
const logger = require('../../../modules/logger');

router.post('/add', async (req, res, next) => {
  try {
    const result = await StructureService.addStructure(req.body);
    return res.status(result.status).json(result);
  } catch (error) {
    logger.error('Error in StructureController - Add Structure:', {
      message: error.message,
      stack: error.stack,
      body: req.body
    });
    next(error);
  }
});

router.get('/all', async (req, res, next) => {
  try {
    const result = await StructureService.getAllStructures();
    return res.status(result.status).json(result);
  } catch (error) {
    logger.error('Error in StructureController - Get All Structures:', {
      message: error.message,
      stack: error.stack
    });
    next(error);
  }
});

module.exports = router;
