const express = require('express')
const router = express.Router()
const ProductionReviewService = require('../services/ProductionReviewService')
const logger = require('../../../modules/logger')

router.post('/meetings', async (req, res, next) => {
  try {
    const result = await ProductionReviewService.addMeeting(req.body)
    return res.status(result.status).json(result)
  } catch (error) {
    logger.error('Error in ProductionReviewController - Add Meeting:', {
      message: error.message,
      stack: error.stack,
      body: req.body,
    })
    next(error)
  }
})

router.put('/meetings/:id', async (req, res, next) => {
  try {
    const result = await ProductionReviewService.updateMeeting(req.params.id, req.body)
    return res.status(result.status).json(result)
  } catch (error) {
    logger.error('Error in ProductionReviewController - Update Meeting:', {
      message: error.message,
      stack: error.stack,
      params: req.params,
      body: req.body,
    })
    next(error)
  }
})

router.get('/meetings', async (req, res, next) => {
  try {
    const result = await ProductionReviewService.getAllMeetings(req.query)
    return res.status(result.status).json(result)
  } catch (error) {
    logger.error('Error in ProductionReviewController - Get Meetings:', {
      message: error.message,
      stack: error.stack,
    })
    next(error)
  }
})

router.post('/discussion-points', async (req, res, next) => {
  try {
    const result = await ProductionReviewService.addDiscussionPoint(req.body)
    return res.status(result.status).json(result)
  } catch (error) {
    logger.error('Error in ProductionReviewController - Add Discussion Point:', {
      message: error.message,
      stack: error.stack,
      body: req.body,
    })
    next(error)
  }
})

router.get('/discussion-points', async (req, res, next) => {
  try {
    const result = await ProductionReviewService.getAllDiscussionPoints(req.query)
    return res.status(result.status).json(result)
  } catch (error) {
    logger.error('Error in ProductionReviewController - Get Discussion Points:', {
      message: error.message,
      stack: error.stack,
    })
    next(error)
  }
})

module.exports = router
