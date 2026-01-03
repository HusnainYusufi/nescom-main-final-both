const PartRepo = require('../repository/part.repository')

class PartService {
  static async addPart(data) {
    try {
      if (!data?.project) {
        return { status: 400, message: 'Project is required', result: null }
      }
      if (!data?.assembly) {
        return { status: 400, message: 'Assembly is required', result: null }
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

  static async getAllParts(filters) {
    try {
      const query = {}
      if (filters?.project) query.project = filters.project
      if (filters?.assembly) query.assembly = filters.assembly
      if (filters?.status) query.status = filters.status

      const parts = await PartRepo.getAll(query)
      return { status: 200, message: 'Record Found', result: parts }
    } catch (error) {
      throw error
    }
  }
}

module.exports = PartService
