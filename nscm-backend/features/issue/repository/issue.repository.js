const IssueModel = require('../model/Issue.model')

class IssueRepository {
  static async create(data) {
    return IssueModel.create(data)
  }

  static async update(id, data) {
    return IssueModel.findByIdAndUpdate(id, data, { new: true })
  }

  static async getAll(filters = {}) {
    return IssueModel.find(filters).populate('project', 'name code')
  }
}

module.exports = IssueRepository

