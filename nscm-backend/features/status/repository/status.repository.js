const StatusModel = require('../model/Status.model')

class StatusRepository {
  static async create(data) {
    return StatusModel.create(data)
  }

  static async update(id, data) {
    return StatusModel.findByIdAndUpdate(id, data, { new: true })
  }

  static async getAll(filters = {}) {
    return StatusModel.find(filters)
      .populate('project', 'name code')
      .populate('set', 'name')
      .populate('assembly', 'name type')
      .populate('part', 'name code')
      .populate('meeting', 'meetingNo meetingType meetingDate')
  }
}

module.exports = StatusRepository
