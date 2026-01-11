const mongoose = require('mongoose')

const StatusSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    set: { type: mongoose.Schema.Types.ObjectId, ref: 'Set' },
    setName: { type: String, trim: true },
    assembly: { type: mongoose.Schema.Types.ObjectId, ref: 'Assembly' },
    part: { type: mongoose.Schema.Types.ObjectId, ref: 'Part' },
    partName: { type: String, trim: true },
    status: { type: String, default: 'Pending' },
    statusType: {
      type: String,
      enum: ['PRM', 'PRE-PRM', 'CURRENT'],
      default: 'CURRENT',
    },
    meeting: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductionMeeting', default: null },
    processOwner: { type: String, trim: true },
    remarks: { type: String, trim: true },
    updatedOn: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

module.exports = mongoose.model('StatusEntry', StatusSchema)
