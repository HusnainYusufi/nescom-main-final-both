const Part = require('../model/Part.model')

class PartRepository {
  static async create(data) {
    return await Part.create(data)
  }

  static async getAll(filters = {}) {
    const query = { ...filters }
    return await Part.find(query).populate('project').populate('assembly').populate('structure').exec()
  }
}

module.exports = PartRepository

