const QualificationTest = require('../model/QualificationTest.model')

class QualificationTestRepository {
  static async create(data) {
    return await QualificationTest.create(data)
  }

  static async getAll(filters = {}) {
    const query = { ...filters }
    return await QualificationTest.find(query)
      .populate('project')
      .populate('part')
      .populate('assembly')
      .exec()
  }
}

module.exports = QualificationTestRepository

