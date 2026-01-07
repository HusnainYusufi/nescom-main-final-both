const mongoose = require('mongoose')

const QualificationTestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    status: { type: String, default: 'Pending' },
    owner: { type: String, trim: true },
    date: { type: Date, default: Date.now },
    remarks: { type: String, trim: true },
    documentType: { type: String, trim: true },
    partId: { type: String, trim: true },
    document: {
      name: { type: String, trim: true },
      url: { type: String, trim: true },
      size: { type: Number },
      type: { type: String, trim: true },
    },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    part: { type: mongoose.Schema.Types.ObjectId, ref: 'Part', required: true },
    assembly: { type: mongoose.Schema.Types.ObjectId, ref: 'Assembly', default: null },
  },
  { timestamps: true },
)

module.exports = mongoose.model('QualificationTest', QualificationTestSchema)
