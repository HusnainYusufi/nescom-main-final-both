const express = require('express')
const router = express.Router()
const WarehouseService = require('../services/WarehouseService')
const logger = require('../../../modules/logger')

router.get('/', async (req, res, next) => {
  try {
    const result = await WarehouseService.getAll()
    return res.status(result.status).json(result)
  } catch (error) {
    logger.error('Error in WarehouseController - Get All:', {
      message: error.message,
      stack: error.stack,
    })
    next(error)
  }
})

router.post('/add', async (req, res, next) => {
  try {
    const result = await WarehouseService.add(req.body)
    return res.status(result.status).json(result)
  } catch (error) {
    logger.error('Error in WarehouseController - Add:', {
      message: error.message,
      stack: error.stack,
      body: req.body,
    })
    next(error)
  }
})

module.exports = router


