const mongoose = require('mongoose')

const PartSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true },
    category: { type: String, trim: true },
    type: { type: String, trim: true },
    level: { type: String, trim: true },
    status: { type: String, trim: true, default: 'Draft' },
    owner: { type: String, trim: true },
    description: { type: String, trim: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    assembly: { type: mongoose.Schema.Types.ObjectId, ref: 'Assembly', default: null },
    structure: { type: mongoose.Schema.Types.ObjectId, ref: 'Structure', default: null },
  },
  { timestamps: true },
)

module.exports = mongoose.model('Part', PartSchema)

