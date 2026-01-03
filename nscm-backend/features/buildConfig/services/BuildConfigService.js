const BuildConfigRepo = require('../repository/buildConfig.repository')

class BuildConfigService {
  static async addConfig(data) {
    try {
      if (!data?.project) {
        return { status: 400, message: 'Project is required', result: null }
      }
      if (!Array.isArray(data?.items) || data.items.length === 0) {
        return { status: 400, message: 'At least one item is required', result: null }
      }
      const config = await BuildConfigRepo.create(data)
      return { status: 200, message: 'Created', result: config }
    } catch (error) {
      throw error
    }
  }

  static async getAllConfigs(filters) {
    try {
      const query = {}
      if (filters?.project) query.project = filters.project
      if (filters?.assembly) query.assembly = filters.assembly
      const configs = await BuildConfigRepo.getAll(query)
      return { status: 200, message: 'Record Found', result: configs }
    } catch (error) {
      throw error
    }
  }
}

module.exports = BuildConfigService

