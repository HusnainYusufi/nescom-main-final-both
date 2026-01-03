const SetModel = require('../model/Set.model')

class SetRepository {
  static async create(data) {
    return SetModel.create(data)
  }

  static async update(id, data) {
    return SetModel.findByIdAndUpdate(id, data, { new: true })
  }

  static async getAll(filters = {}) {
    return SetModel.find(filters).populate('project', 'name code')
  }

  static async findById(id) {
    return SetModel.findById(id)
  }
}

module.exports = SetRepository

