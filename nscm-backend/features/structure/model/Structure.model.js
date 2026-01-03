const mongoose = require('mongoose');

const StructureSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    materialSpecs: { type: String },
    notes: { type: String },
    assemblies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Assembly' }]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Structure', StructureSchema);
