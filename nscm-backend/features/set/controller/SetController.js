const express = require('express')
const router = express.Router()
const SetService = require('../services/SetService')
const logger = require('../../../modules/logger')

router.post('/add', async (req, res, next) => {
  try {
    const result = await SetService.addSet(req.body)
    return res.status(result.status).json(result)
  } catch (error) {
    logger.error('Error in SetController - Add Set:', {
      message: error.message,
      stack: error.stack,
      body: req.body,
    })
    next(error)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const result = await SetService.updateSet(req.params.id, req.body)
    return res.status(result.status).json(result)
  } catch (error) {
    logger.error('Error in SetController - Update Set:', {
      message: error.message,
      stack: error.stack,
      params: req.params,
      body: req.body,
    })
    next(error)
  }
})

router.get('/all', async (req, res, next) => {
  try {
    const result = await SetService.getAllSets(req.query)
    return res.status(result.status).json(result)
  } catch (error) {
    logger.error('Error in SetController - Get All Sets:', {
      message: error.message,
      stack: error.stack,
    })
    next(error)
  }
})

module.exports = router

