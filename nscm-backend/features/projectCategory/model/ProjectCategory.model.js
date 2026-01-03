const mongoose = require('mongoose');

const ProjectCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProjectCategory', ProjectCategorySchema);
