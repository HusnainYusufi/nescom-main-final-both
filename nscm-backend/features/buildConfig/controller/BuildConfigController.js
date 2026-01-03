const express = require('express')
const router = express.Router()
const BuildConfigService = require('../services/BuildConfigService')
const logger = require('../../../modules/logger')

router.post('/add', async (req, res, next) => {
  try {
    const result = await BuildConfigService.addConfig(req.body)
    return res.status(result.status).json(result)
  } catch (error) {
    logger.error('Error in BuildConfigController - Add Config:', {
      message: error.message,
      stack: error.stack,
      body: req.body,
    })
    next(error)
  }
})

router.get('/all', async (req, res, next) => {
  try {
    const result = await BuildConfigService.getAllConfigs(req.query)
    return res.status(result.status).json(result)
  } catch (error) {
    logger.error('Error in BuildConfigController - Get All Configs:', {
      message: error.message,
      stack: error.stack,
    })
    next(error)
  }
})

module.exports = router

