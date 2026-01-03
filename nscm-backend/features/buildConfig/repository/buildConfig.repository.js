const BuildConfig = require('../model/BuildConfig.model')

class BuildConfigRepository {
  static async create(data) {
    return await BuildConfig.create(data)
  }

  static async getAll(filters = {}) {
    const query = { ...filters }
    return await BuildConfig.find(query).populate('project').populate('assembly').populate('items.part').exec()
  }
}

module.exports = BuildConfigRepository

