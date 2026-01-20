const Part = require('../model/Part.model')

class PartRepository {
  static async create(data) {
    return await Part.create(data)
  }

  static async getAll(filters = {}) {
    const query = { ...filters }
    return await Part.find(query)
      .populate('project')
      .populate('set')
      .populate('parentPart')
      .populate('assembly')
      .populate('structure')
      .exec()
  }

  static async getTree(projectId, setId) {
    // Get all parts for the set, build tree structure
    const parts = await Part.find({ project: projectId, set: setId })
      .populate('project')
      .populate('set')
      .populate('parentPart')
      .populate('assembly')
      .populate('structure')
      .exec()
    
    // Build tree structure
    const partMap = new Map()
    const rootParts = []
    
    parts.forEach((part) => {
      partMap.set(part._id.toString(), { ...part.toObject(), children: [] })
    })
    
    parts.forEach((part) => {
      const partObj = partMap.get(part._id.toString())
      if (part.parentPart) {
        const parentId = part.parentPart._id ? part.parentPart._id.toString() : part.parentPart.toString()
        const parent = partMap.get(parentId)
        if (parent) {
          parent.children.push(partObj)
        } else {
          rootParts.push(partObj)
        }
      } else {
        rootParts.push(partObj)
      }
    })
    
    return rootParts
  }

  static async findByParent(parentPartId) {
    return await Part.find({ parentPart: parentPartId }).exec()
  }

  static async deleteById(partId) {
    return await Part.findByIdAndDelete(partId).exec()
  }

  static async getById(partId) {
    return await Part.findById(partId)
      .populate('project')
      .populate('set')
      .populate('parentPart')
      .populate('assembly')
      .populate('structure')
      .exec()
  }

  static async updateById(partId, data) {
    return await Part.findByIdAndUpdate(partId, data, { new: true })
      .populate('project')
      .populate('set')
      .populate('parentPart')
      .populate('assembly')
      .populate('structure')
      .exec()
  }

  static async findByDrawingNo(drawingNo) {
    return await Part.find({ drawingNo: { $regex: drawingNo, $options: 'i' } })
      .populate('project')
      .populate('set')
      .exec()
  }
}

module.exports = PartRepository

