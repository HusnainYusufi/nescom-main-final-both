const express = require('express')
const router = express.Router()
const QualificationTestService = require('../services/QualificationTestService')
const logger = require('../../../modules/logger')
const { documentUpload } = require('../../../middlewares/upload.middleware')

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

router.post('/upload', (req, res, next) => {
  documentUpload(req, res, (err) => {
    if (err) {
      logger.error('Error in QualificationTestController - Upload:', {
        message: err.message,
        stack: err.stack,
      })
      return res.status(400).json({ status: 400, message: err.message, result: null })
    }

    if (!req.file) {
      return res.status(400).json({ status: 400, message: 'No file uploaded', result: null })
    }

    const file = req.file
    const result = {
      name: file.originalname,
      url: `/uploads/${file.filename}`,
      size: file.size,
      type: file.mimetype,
    }
    return res.status(200).json({ status: 200, message: 'Uploaded', result })
  })
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
