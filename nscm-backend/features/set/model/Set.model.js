const mongoose = require('mongoose')

const SetSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    supervisor: { type: String, trim: true },
    partsCount: { type: Number, default: 0 },
    progress: { type: Number, default: 0 }, // percentage
    remarks: { type: String, trim: true },
  },
  { timestamps: true },
)

module.exports = mongoose.model('Set', SetSchema)

