const express = require('express')
const router = express.Router()
const StatusService = require('../services/StatusService')
const logger = require('../../../modules/logger')

router.post('/add', async (req, res, next) => {
  try {
    const result = await StatusService.addStatus(req.body)
    return res.status(result.status).json(result)
  } catch (error) {
    logger.error('Error in StatusController - Add:', {
      message: error.message,
      stack: error.stack,
      body: req.body,
    })
    next(error)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const result = await StatusService.updateStatus(req.params.id, req.body)
    return res.status(result.status).json(result)
  } catch (error) {
    logger.error('Error in StatusController - Update:', {
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
    const result = await StatusService.getAllStatuses(req.query)
    return res.status(result.status).json(result)
  } catch (error) {
    logger.error('Error in StatusController - Get All:', {
      message: error.message,
      stack: error.stack,
    })
    next(error)
  }
})

module.exports = router

