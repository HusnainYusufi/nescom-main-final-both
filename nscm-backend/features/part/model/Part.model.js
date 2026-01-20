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
    drawingNo: { type: String, trim: true },
    partIdNo: { type: String, trim: true },
    
    // Part type classification
    partType: { 
      type: String, 
      enum: ['Mechanical', 'Electrical', 'Ablative', 'Composite'], 
      default: 'Mechanical'
    },
    
    // For Mechanical parts only
    designNumber: { type: String, trim: true },
    revisionNumber: { type: String, trim: true },
    revisionDate: { type: Date },
    
    // For non-Mechanical parts (Electrical, Ablative, Composite)
    partIdOrReference: { type: String, trim: true },
    
    // Qualification fields (all types)
    isQualified: { type: Boolean, default: false },
    qualificationReport: {
      name: { type: String },
      url: { type: String },
      uploadedAt: { type: Date }
    },
    
    // NCR fields (when not qualified - all types)
    ncr: {
      number: { type: String },
      report: {
        name: { type: String },
        url: { type: String },
        uploadedAt: { type: Date }
      }
    },
    
    // References (made optional for registry parts)
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    set: { type: mongoose.Schema.Types.ObjectId, ref: 'Set' },
    parentPart: { type: mongoose.Schema.Types.ObjectId, ref: 'Part', default: null },
    assembly: { type: mongoose.Schema.Types.ObjectId, ref: 'Assembly', default: null },
    structure: { type: mongoose.Schema.Types.ObjectId, ref: 'Structure', default: null },
  },
  { timestamps: true },
)

module.exports = mongoose.model('Part', PartSchema)
