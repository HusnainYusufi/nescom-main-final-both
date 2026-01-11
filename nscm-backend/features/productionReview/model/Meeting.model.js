const mongoose = require('mongoose')

const MeetingSchema = new mongoose.Schema(
  {
    meetingType: {
      type: String,
      required: true,
      enum: ['PRM', 'PRE-PRM'],
      trim: true,
    },
    meetingDate: { type: Date, required: true },
    meetingNo: { type: String, required: true, unique: true, trim: true },
  },
  { timestamps: true },
)

module.exports = mongoose.model('ProductionMeeting', MeetingSchema)
