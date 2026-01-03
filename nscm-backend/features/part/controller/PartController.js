const express = require('express')
const router = express.Router()
const PartService = require('../services/PartService')
const logger = require('../../../modules/logger')

router.post('/add', async (req, res, next) => {
  try {
    const result = await PartService.addPart(req.body)
    return res.status(result.status).json(result)
  } catch (error) {
    logger.error('Error in PartController - Add Part:', {
      message: error.message,
      stack: error.stack,
      body: req.body,
    })
    next(error)
  }
})

router.get('/all', async (req, res, next) => {
  try {
    const result = await PartService.getAllParts(req.query)
    return res.status(result.status).json(result)
  } catch (error) {
    logger.error('Error in PartController - Get All Parts:', {
      message: error.message,
      stack: error.stack,
    })
    next(error)
  }
})

module.exports = router

