const Meeting = require('../model/Meeting.model')

class MeetingRepository {
  static async create(data) {
    return Meeting.create(data)
  }

  static async update(id, data) {
    return Meeting.findByIdAndUpdate(id, data, { new: true })
  }

  static async getById(id) {
    return Meeting.findById(id).exec()
  }

  static async getAll(filters = {}) {
    return Meeting.find(filters).sort({ meetingDate: -1, createdAt: -1 }).exec()
  }

  static async countByType(meetingType) {
    return Meeting.countDocuments({ meetingType })
  }
}

module.exports = MeetingRepository
