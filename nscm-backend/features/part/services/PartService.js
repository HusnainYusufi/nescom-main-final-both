const PartRepo = require('../repository/part.repository')

class PartService {
  static async addPart(data) {
    try {
      // For registry parts, project and set are optional
      if (!data?.name || !data?.code) {
        return { status: 400, message: 'Name and code are required', result: null }
      }
      const part = await PartRepo.create(data)
      return { status: 200, message: 'Created', result: part }
    } catch (error) {
      throw error
    }
  }

  static async getPartById(partId) {
    try {
      if (!partId) {
        return { status: 400, message: 'Part ID is required', result: null }
      }
      const part = await PartRepo.getById(partId)
      if (!part) {
        return { status: 404, message: 'Part not found', result: null }
      }
      return { status: 200, message: 'Record Found', result: part }
    } catch (error) {
      throw error
    }
  }

  static async updatePart(partId, data) {
    try {
      if (!partId) {
        return { status: 400, message: 'Part ID is required', result: null }
      }
      const part = await PartRepo.updateById(partId, data)
      if (!part) {
        return { status: 404, message: 'Part not found', result: null }
      }
      return { status: 200, message: 'Updated', result: part }
    } catch (error) {
      throw error
    }
  }

  static async deletePart(partId) {
    try {
      if (!partId) {
        return { status: 400, message: 'Part ID is required', result: null }
      }
      const deleted = await PartRepo.deleteById(partId)
      if (!deleted) {
        return { status: 404, message: 'Part not found', result: null }
      }
      return { status: 200, message: 'Deleted', result: deleted }
    } catch (error) {
      throw error
    }
  }

  static async getAllParts(filters) {
    try {
      const query = {}
      if (filters?.project) query.project = filters.project
      if (filters?.set) query.set = filters.set
      if (filters?.assembly) query.assembly = filters.assembly
      if (filters?.status) query.status = filters.status

      const parts = await PartRepo.getAll(query)
      return { status: 200, message: 'Record Found', result: parts }
    } catch (error) {
      throw error
    }
  }

  static async getTree(projectId, setId) {
    try {
      if (!projectId || !setId) {
        return { status: 400, message: 'Project ID and Set ID are required', result: null }
      }
      const tree = await PartRepo.getTree(projectId, setId)
      return { status: 200, message: 'Record Found', result: tree }
    } catch (error) {
      throw error
    }
  }

  static async addToTree(data) {
    try {
      if (!data?.project || !data?.set) {
        return { status: 400, message: 'Project and Set are required', result: null }
      }
      if (!data?.name || !data?.code) {
        return { status: 400, message: 'Name and code are required', result: null }
      }
      const part = await PartRepo.create(data)
      return { status: 200, message: 'Created', result: part }
    } catch (error) {
      throw error
    }
  }

  static async removeFromTree(partId) {
    try {
      if (!partId) {
        return { status: 400, message: 'Part ID is required', result: null }
      }
      // Check if part has children
      const children = await PartRepo.findByParent(partId)
      if (children.length > 0) {
        return { status: 400, message: 'Cannot remove part with child parts. Remove children first.', result: null }
      }
      const deleted = await PartRepo.deleteById(partId)
      if (!deleted) {
        return { status: 404, message: 'Part not found', result: null }
      }
      return { status: 200, message: 'Deleted', result: deleted }
    } catch (error) {
      throw error
    }
  }

  static async searchByDrawingNo(drawingNo) {
    try {
      if (!drawingNo) {
        return { status: 400, message: 'Drawing number is required', result: null }
      }
      const parts = await PartRepo.findByDrawingNo(drawingNo)
      return { status: 200, message: 'Record Found', result: parts }
    } catch (error) {
      throw error
    }
  }
}

module.exports = PartService
