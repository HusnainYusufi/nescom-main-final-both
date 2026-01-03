const mongoose = require('mongoose')

const IssueSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    set: { type: mongoose.Schema.Types.ObjectId },
    structure: { type: mongoose.Schema.Types.ObjectId, ref: 'Structure', default: null },
    assembly: { type: mongoose.Schema.Types.ObjectId, ref: 'Assembly', default: null },
    part: { type: mongoose.Schema.Types.ObjectId, ref: 'Part', default: null },
    severity: { type: String, default: 'Medium' },
    status: { type: String, default: 'Open' },
    assignedTo: { type: String, trim: true },
    remarks: { type: String, trim: true },
  },
  { timestamps: true },
)

module.exports = mongoose.model('Issue', IssueSchema)
