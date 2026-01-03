const ProjectCategory = require('../model/ProjectCategory.model');

class ProjectCategoryRepository {
  static async create(data) {
    return await ProjectCategory.create(data);
  }

  static async getAll() {
    return await ProjectCategory.find({}).exec();
  }

  static async getById(id) {
    return await ProjectCategory.findById(id).exec();
  }
}

module.exports = ProjectCategoryRepository;
