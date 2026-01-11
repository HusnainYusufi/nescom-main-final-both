const MeetingRepo = require('../repository/meeting.repository')
const DiscussionPointRepo = require('../repository/discussionPoint.repository')

const MEETING_TYPES = ['PRM', 'PRE-PRM']

const padSequence = (value) => String(value).padStart(3, '0')

class ProductionReviewService {
  static async addMeeting(data) {
    const meetingType = data?.meetingType
    if (!meetingType || !MEETING_TYPES.includes(meetingType)) {
      return { status: 400, message: 'Meeting type must be PRM or PRE-PRM', result: null }
    }
    if (!data?.meetingDate) {
      return { status: 400, message: 'Meeting date is required', result: null }
    }
    const count = await MeetingRepo.countByType(meetingType)
    const meetingNo = `${meetingType}-${padSequence(count + 1)}`
    const created = await MeetingRepo.create({
      meetingType,
      meetingDate: data.meetingDate,
      meetingNo,
    })
    return { status: 200, message: 'Created', result: created }
  }

  static async updateMeeting(id, data) {
    if (!id) return { status: 400, message: 'Meeting id is required', result: null }
    if (data?.meetingType && !MEETING_TYPES.includes(data.meetingType)) {
      return { status: 400, message: 'Meeting type must be PRM or PRE-PRM', result: null }
    }
    const updatePayload = {}
    if (data?.meetingDate) updatePayload.meetingDate = data.meetingDate
    const updated = await MeetingRepo.update(id, updatePayload)
    if (!updated) return { status: 404, message: 'Meeting not found', result: null }
    return { status: 200, message: 'Updated', result: updated }
  }

  static async getAllMeetings(filters) {
    const query = {}
    if (filters?.meetingType && MEETING_TYPES.includes(filters.meetingType)) {
      query.meetingType = filters.meetingType
    }
    const meetings = await MeetingRepo.getAll(query)
    return { status: 200, message: 'Record Found', result: meetings }
  }

  static async addDiscussionPoint(data) {
    if (!data?.project) {
      return { status: 400, message: 'Project is required', result: null }
    }
    if (!data?.set) {
      return { status: 400, message: 'Set is required', result: null }
    }
    if (!data?.meeting) {
      return { status: 400, message: 'Meeting is required', result: null }
    }
    if (!data?.discussionPoint) {
      return { status: 400, message: 'Discussion point is required', result: null }
    }
    const meeting = await MeetingRepo.getById(data.meeting)
    if (!meeting) return { status: 404, message: 'Meeting not found', result: null }
    if (meeting.meetingType !== 'PRM') {
      return { status: 400, message: 'Discussion points can only be added for PRM meetings', result: null }
    }
    const created = await DiscussionPointRepo.create({
      project: data.project,
      set: data.set,
      meeting: data.meeting,
      discussionPoint: data.discussionPoint,
    })
    return { status: 200, message: 'Created', result: created }
  }

  static async getAllDiscussionPoints(filters) {
    const query = {}
    if (filters?.project) query.project = filters.project
    if (filters?.set) query.set = filters.set
    if (filters?.meeting) query.meeting = filters.meeting
    const points = await DiscussionPointRepo.getAll(query)
    return { status: 200, message: 'Record Found', result: points }
  }
}

module.exports = ProductionReviewService
