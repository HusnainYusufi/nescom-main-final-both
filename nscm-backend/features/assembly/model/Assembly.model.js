const mongoose = require('mongoose');

const AssemblySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['assembly', 'sub-assembly', 'kit'], required: true },
    notes: { type: String },
    parentAssembly: { type: mongoose.Schema.Types.ObjectId, ref: 'Assembly', default: null },
    qcReports: [
      {
        title: { type: String, required: true, trim: true },
        status: { type: String, default: 'Pending', trim: true },
        owner: { type: String, trim: true },
        comments: { type: String },
        remarks: { type: String },
        document: {
          name: { type: String },
          url: { type: String },
          size: { type: Number },
          type: { type: String }
        },
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Assembly', AssemblySchema);
