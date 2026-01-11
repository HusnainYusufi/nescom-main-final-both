const DiscussionPoint = require('../model/DiscussionPoint.model')

class DiscussionPointRepository {
  static async create(data) {
    return DiscussionPoint.create(data)
  }

  static async getAll(filters = {}) {
    return DiscussionPoint.find(filters)
      .populate('project', 'name code category')
      .populate('set', 'name')
      .populate('meeting', 'meetingNo meetingType meetingDate')
      .sort({ createdAt: -1 })
      .exec()
  }
}

module.exports = DiscussionPointRepository
