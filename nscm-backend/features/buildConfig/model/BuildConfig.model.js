const mongoose = require('mongoose')

const BuildConfigItemSchema = new mongoose.Schema(
  {
    part: { type: mongoose.Schema.Types.ObjectId, ref: 'Part', required: true },
    quantity: { type: Number, default: 1 },
    position: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { _id: false },
)

const BuildConfigSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    assembly: { type: mongoose.Schema.Types.ObjectId, ref: 'Assembly', default: null },
    status: { type: String, default: 'Draft' },
    items: [BuildConfigItemSchema],
  },
  { timestamps: true },
)

module.exports = mongoose.model('BuildConfig', BuildConfigSchema)

