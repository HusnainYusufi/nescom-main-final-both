const mongoose = require('mongoose')

const DiscussionPointSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    set: { type: mongoose.Schema.Types.ObjectId, ref: 'Set', required: true },
    meeting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductionMeeting',
      required: true,
    },
    discussionPoint: { type: String, required: true, trim: true },
  },
  { timestamps: true },
)

module.exports = mongoose.model('DiscussionPoint', DiscussionPointSchema)
