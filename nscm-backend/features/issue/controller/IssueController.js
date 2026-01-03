const express = require('express')
const router = express.Router()
const IssueService = require('../services/IssueService')
const logger = require('../../../modules/logger')

router.post('/add', async (req, res, next) => {
  try {
    const result = await IssueService.addIssue(req.body)
    return res.status(result.status).json(result)
  } catch (error) {
    logger.error('Error in IssueController - Add Issue:', {
      message: error.message,
      stack: error.stack,
      body: req.body,
    })
    next(error)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const result = await IssueService.updateIssue(req.params.id, req.body)
    return res.status(result.status).json(result)
  } catch (error) {
    logger.error('Error in IssueController - Update Issue:', {
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
    const result = await IssueService.getAllIssues(req.query)
    return res.status(result.status).json(result)
  } catch (error) {
    logger.error('Error in IssueController - Get All Issues:', {
      message: error.message,
      stack: error.stack,
    })
    next(error)
  }
})

module.exports = router

