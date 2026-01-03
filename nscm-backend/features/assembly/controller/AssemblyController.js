const express = require('express');
const router = express.Router();
const AssemblyService = require('../services/AssemblyService');
const logger = require('../../../modules/logger');

router.post('/add', async (req, res, next) => {
  try {
    const result = await AssemblyService.addAssembly(req.body);
    return res.status(result.status).json(result);
  } catch (error) {
    logger.error('Error in AssemblyController - Add Assembly:', {
      message: error.message,
      stack: error.stack,
      body: req.body
    });
    next(error);
  }
});

router.get('/all', async (req, res, next) => {
  try {
    const result = await AssemblyService.getAllAssemblies();
    return res.status(result.status).json(result);
  } catch (error) {
    logger.error('Error in AssemblyController - Get All Assemblies:', {
      message: error.message,
      stack: error.stack
    });
    next(error);
  }
});

router.post('/:id/qc-report', async (req, res, next) => {
  try {
    const result = await AssemblyService.addQcReport(req.params.id, req.body);
    return res.status(result.status).json(result);
  } catch (error) {
    logger.error('Error in AssemblyController - Add QC Report:', {
      message: error.message,
      stack: error.stack,
      body: req.body,
      params: req.params
    });
    next(error);
  }
});

module.exports = router;
