const mongoose = require('mongoose')

const StatusSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    part: { type: mongoose.Schema.Types.ObjectId, ref: 'Part' },
    partName: { type: String, trim: true },
    status: { type: String, default: 'Pending' },
    remarks: { type: String, trim: true },
    updatedOn: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

module.exports = mongoose.model('StatusEntry', StatusSchema)

