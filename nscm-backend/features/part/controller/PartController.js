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

router.get('/:id', async (req, res, next) => {
  try {
    const result = await PartService.getPartById(req.params.id)
    return res.status(result.status).json(result)
  } catch (error) {
    logger.error('Error in PartController - Get Part By ID:', {
      message: error.message,
      stack: error.stack,
      params: req.params,
    })
    next(error)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const result = await PartService.updatePart(req.params.id, req.body)
    return res.status(result.status).json(result)
  } catch (error) {
    logger.error('Error in PartController - Update Part:', {
      message: error.message,
      stack: error.stack,
      params: req.params,
      body: req.body,
    })
    next(error)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await PartService.deletePart(req.params.id)
    return res.status(result.status).json(result)
  } catch (error) {
    logger.error('Error in PartController - Delete Part:', {
      message: error.message,
      stack: error.stack,
      params: req.params,
    })
    next(error)
  }
})

router.get('/tree/:projectId/:setId', async (req, res, next) => {
  try {
    const result = await PartService.getTree(req.params.projectId, req.params.setId)
    return res.status(result.status).json(result)
  } catch (error) {
    logger.error('Error in PartController - Get Tree:', {
      message: error.message,
      stack: error.stack,
      params: req.params,
    })
    next(error)
  }
})

router.post('/tree', async (req, res, next) => {
  try {
    const result = await PartService.addToTree(req.body)
    return res.status(result.status).json(result)
  } catch (error) {
    logger.error('Error in PartController - Add To Tree:', {
      message: error.message,
      stack: error.stack,
      body: req.body,
    })
    next(error)
  }
})

router.delete('/tree/:partId', async (req, res, next) => {
  try {
    const result = await PartService.removeFromTree(req.params.partId)
    return res.status(result.status).json(result)
  } catch (error) {
    logger.error('Error in PartController - Remove From Tree:', {
      message: error.message,
      stack: error.stack,
      params: req.params,
    })
    next(error)
  }
})

router.get('/by-drawing/:drawingNo', async (req, res, next) => {
  try {
    const result = await PartService.searchByDrawingNo(req.params.drawingNo)
    return res.status(result.status).json(result)
  } catch (error) {
    logger.error('Error in PartController - Search By Drawing No:', {
      message: error.message,
      stack: error.stack,
      params: req.params,
    })
    next(error)
  }
})

module.exports = router

