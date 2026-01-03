const express = require('express')
const router = express.Router()
const QualificationTestService = require('../services/QualificationTestService')
const logger = require('../../../modules/logger')

router.post('/add', async (req, res, next) => {
  try {
    const result = await QualificationTestService.addTest(req.body)
    return res.status(result.status).json(result)
  } catch (error) {
    logger.error('Error in QualificationTestController - Add Test:', {
      message: error.message,
      stack: error.stack,
      body: req.body,
    })
    next(error)
  }
})

router.get('/all', async (req, res, next) => {
  try {
    const result = await QualificationTestService.getAllTests(req.query)
    return res.status(result.status).json(result)
  } catch (error) {
    logger.error('Error in QualificationTestController - Get All Tests:', {
      message: error.message,
      stack: error.stack,
    })
    next(error)
  }
})

module.exports = router

