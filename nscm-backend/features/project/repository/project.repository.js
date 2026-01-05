const Project = require('../model/Project.model');

class ProjectRepository {
  static async create(data) {
    return await Project.create(data);
  }

  static async updateById(id, update) {
    return await Project.findByIdAndUpdate(id, update, { new: true }).exec();
  }

  static async getById(id) {
    return await Project.findById(id)
      .populate('category')
      .populate('structures')
      .populate({ path: 'sets.assemblies', populate: { path: 'parentAssembly' } })
      .populate({ path: 'sets.structures', populate: { path: 'assemblies' } })
      .exec();
  }

  static async getAll() {
    return await Project.find({})
      .populate('category')
      .populate('structures')
      .populate({ path: 'sets.assemblies', populate: { path: 'parentAssembly' } })
      .populate({ path: 'sets.structures', populate: { path: 'assemblies' } })
      .exec();
  }

  static async getByCode(code) {
    return await Project.findOne({ code }).exec();
  }
}

module.exports = ProjectRepository;
